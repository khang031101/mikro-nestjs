import { QueryDto } from '@/common/dtos';
import { DocumentVersion } from '@/entities/document-version.entity';
import { Document } from '@/entities/document.entity';
import { Workspace } from '@/entities/workspace.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: EntityRepository<Document>,
    @InjectRepository(DocumentVersion)
    private readonly documentVersionRepository: EntityRepository<DocumentVersion>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: EntityRepository<Workspace>,
    private readonly em: EntityManager,
  ) {}

  private async requireWorkspace(workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  private async requireDocument(documentId: string) {
    const document = await this.documentRepository.findOne(documentId, {
      populate: ['workspace'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async createInWorkspace(workspaceId: string, title: string) {
    const workspace = await this.requireWorkspace(workspaceId);

    const document = new Document();
    document.title = title;
    document.workspace = workspace;
    document.snapshot = {};
    document.tenantId = workspace.id;

    this.em.persist(document);
    await this.em.flush();

    return document;
  }

  async listByWorkspace(workspaceId: string, query: QueryDto) {
    await this.requireWorkspace(workspaceId);

    const [items, total] = await this.documentRepository.findAndCount(
      { workspace: workspaceId },
      {
        limit: query.take,
        offset: query.skip,
        orderBy: { createdAt: 'desc' },
      },
    );

    return {
      items,
      total,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async getMetadata(documentId: string) {
    return this.requireDocument(documentId);
  }

  async getSnapshot(documentId: string) {
    const document = await this.requireDocument(documentId);
    return { snapshot: document.snapshot };
  }

  async getMarkdown(documentId: string) {
    const document = await this.requireDocument(documentId);
    const snapshot = this.ensureSnapshotObject(document.snapshot);
    return { markdown: snapshot.markdown ?? '' };
  }

  async setMarkdown(documentId: string, markdown: string) {
    const document = await this.requireDocument(documentId);
    const snapshot = this.ensureSnapshotObject(document.snapshot);
    snapshot.markdown = markdown;

    document.snapshot = snapshot;
    this.em.persist(document);
    await this.em.flush();

    return { markdown };
  }

  async createSnapshot(documentId: string, snapshot: unknown) {
    if (snapshot === undefined) {
      throw new BadRequestException('Snapshot is required');
    }

    const document = await this.requireDocument(documentId);
    const latestVersion = await this.documentVersionRepository.findOne(
      { document: documentId },
      { orderBy: { version: 'desc' } },
    );

    const version = new DocumentVersion();
    version.document = document;
    version.version = latestVersion ? latestVersion.version + 1 : 1;
    version.updateBinary = Buffer.from(JSON.stringify(snapshot));
    version.tenantId = document.tenantId;

    document.snapshot = snapshot;

    this.em.persist([document, version]);
    await this.em.flush();

    return version;
  }

  async getVersions(documentId: string) {
    await this.requireDocument(documentId);
    return this.documentVersionRepository.find(
      { document: documentId },
      { orderBy: { version: 'desc' } },
    );
  }

  async restoreVersion(documentId: string, versionNumber: number) {
    const document = await this.requireDocument(documentId);

    const version = await this.documentVersionRepository.findOne({
      document: documentId,
      version: versionNumber,
    });

    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    try {
      document.snapshot = JSON.parse(version.updateBinary.toString());
    } catch {
      throw new BadRequestException('Invalid snapshot data');
    }

    this.em.persist(document);
    await this.em.flush();

    return document;
  }

  private ensureSnapshotObject(snapshot: unknown): Record<string, unknown> & {
    markdown?: string;
  } {
    if (!snapshot || typeof snapshot !== 'object') {
      return {};
    }

    return snapshot as Record<string, unknown> & { markdown?: string };
  }
}
