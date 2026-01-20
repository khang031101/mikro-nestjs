import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { DocumentService } from './document.service';
import {
  CreateDocumentSnapshotDto,
  RestoreDocumentVersionDto,
  SetDocumentMarkdownDto,
} from './dtos';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get(':id')
  getDocumentMetadata(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.getMetadata(id);
  }

  @Get(':id/snapshot')
  getDocumentSnapshot(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.getSnapshot(id);
  }

  @Post(':id/snapshot')
  createDocumentSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateDocumentSnapshotDto,
  ) {
    return this.documentService.createSnapshot(id, body.snapshot);
  }

  @Get(':id/versions')
  getDocumentVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.getVersions(id);
  }

  @Post(':id/restore')
  restoreDocumentVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RestoreDocumentVersionDto,
  ) {
    return this.documentService.restoreVersion(id, body.version);
  }

  @Get(':id/markdown')
  getDocumentMarkdown(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.getMarkdown(id);
  }

  @Post(':id/markdown')
  setDocumentMarkdown(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetDocumentMarkdownDto,
  ) {
    return this.documentService.setMarkdown(id, body.markdown);
  }
}
