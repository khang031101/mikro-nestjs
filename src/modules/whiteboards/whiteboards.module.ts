import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Whiteboard } from './entities/whiteboard.entity';
import { WhiteboardVersion } from './entities/whiteboard-version.entity';
import { WhiteboardsController } from './whiteboards.controller';
import { WhiteboardsGateway } from './whiteboards.gateway';
import { WhiteboardsService } from './whiteboards.service';

@Module({
  imports: [MikroOrmModule.forFeature([Whiteboard, WhiteboardVersion])],
  controllers: [WhiteboardsController],
  providers: [WhiteboardsService, WhiteboardsGateway],
  exports: [WhiteboardsService],
})
export class WhiteboardsModule {}
