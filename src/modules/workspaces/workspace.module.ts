import { User } from '@/entities/user.entity';
import { WorkspaceMember } from '@/entities/workspace-member.entity';
import { Workspace } from '@/entities/workspace.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { DocumentModule } from '../documents/document.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Workspace, WorkspaceMember, User]),
    DocumentModule,
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
