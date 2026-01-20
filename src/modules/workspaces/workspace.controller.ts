import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '@/common/decorators';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { WorkspaceService } from './workspace.service';
import { QueryMemberDto } from './dtos/query-member.dto';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { QueryDocumentDto } from './dtos/query-document.dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  createWorkspace(
    @CurrentUserId() userId: string,
    @Body() body: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(userId, body);
  }

  @Get()
  getWorkspaces(@CurrentUserId() userId: string) {
    return this.workspaceService.getWorkspaces(userId);
  }

  // Members
  @Post(':id/invite')
  inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: InviteMemberDto,
  ) {
    return this.workspaceService.inviteMember(id, body);
  }

  @Get(':id/members')
  getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryMemberDto,
  ) {
    return this.workspaceService.getMembers(id, query);
  }

  // Documents
  @Post(':id/documents')
  createDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateDocumentDto,
  ) {
    return this.workspaceService.createDocument(id, body);
  }

  @Get(':id/documents')
  getDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryDocumentDto,
  ) {
    return this.workspaceService.getDocuments(id, query);
  }
}
