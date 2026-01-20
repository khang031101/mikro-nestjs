import { DocumentVersion } from '@/entities/document-version.entity';
import { Document } from '@/entities/document.entity';
import { WorkspaceMember } from '@/entities/workspace-member.entity';
import { Workspace } from '@/entities/workspace.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentController } from './document.controller';
import { DocumentGateway } from './document.gateway';
import { DocumentService } from './document.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Document,
      DocumentVersion,
      Workspace,
      WorkspaceMember,
    ]),
    AuthModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentGateway],
  exports: [DocumentService],
})
export class DocumentModule {}
