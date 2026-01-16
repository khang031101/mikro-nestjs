import { DocumentVersion } from '@/entities/document-version.entity';
import { Document } from '@/entities/document.entity';
import { Workspace } from '@/entities/workspace.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [MikroOrmModule.forFeature([Document, DocumentVersion, Workspace])],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
