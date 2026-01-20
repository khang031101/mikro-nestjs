import { QueryDto } from '@/common/dtos';
import { User } from '@/entities/user.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '@/entities/workspace-member.entity';
import { Workspace } from '@/entities/workspace.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentService } from '../documents/document.service';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { QueryDocumentDto } from './dtos/query-document.dto';
import { QueryMemberDto } from './dtos/query-member.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: EntityRepository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: EntityRepository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly documentService: DocumentService,
  ) {}

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const user = await this.userRepository.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const workspace = new Workspace();
    workspace.name = dto.name;

    const member = new WorkspaceMember();
    member.workspace = workspace;
    member.user = user;
    member.role = WorkspaceRole.OWNER;
    member.tenantId = workspace.id;

    this.em.persist([workspace, member]);
    await this.em.flush();

    return workspace.id;
  }

  async inviteMember(workspaceId: string, dto: InviteMemberDto) {
    const workspace = await this.workspaceRepository.findOne(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.userRepository.findOne({
      email: dto.email,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let member = await this.workspaceMemberRepository.findOne({
      workspace: workspaceId,
      user: user.id,
    });

    if (!member) {
      member = new WorkspaceMember();
      member.workspace = workspace;
      member.user = user;
      member.tenantId = workspace.id;
    }

    member.role = dto.role;
    member.isActive = true;

    this.em.persist(member);
    await this.em.flush();

    return member;
  }

  async getWorkspaces(userId: string) {
    const memberships = await this.workspaceMemberRepository.find(
      {
        user: userId,
        isActive: true,
      },
      { filters: false },
    );

    const workspaceIds = memberships.map((m) => m.workspace.id);

    const workspaces = await this.workspaceRepository.find({
      id: { $in: workspaceIds },
    });

    return workspaces;
  }

  async getMembers(workspaceId: string, query: QueryMemberDto) {
    const workspace = await this.workspaceRepository.findOne(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const [items, total] = await this.workspaceMemberRepository.findAndCount(
      { workspace: workspaceId },
      {
        populate: ['user'],
        limit: query.take,
        offset: query.skip,
      },
    );

    return {
      items,
      total,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async createDocument(workspaceId: string, dto: CreateDocumentDto) {
    return this.documentService.createInWorkspace(workspaceId, dto.title);
  }

  async getDocuments(workspaceId: string, query: QueryDocumentDto) {
    return this.documentService.listByWorkspace(workspaceId, query as QueryDto);
  }
}
