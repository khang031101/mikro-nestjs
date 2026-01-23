import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateWhiteboardDto } from './dtos/create-whiteboard.dto';
import { QueryWhiteboardDto } from './dtos/query-whiteboard.dto';
import { WhiteboardsService } from './whiteboards.service';

@Controller('whiteboards')
export class WhiteboardsController {
  constructor(private readonly whiteboardsService: WhiteboardsService) {}

  @Post()
  create(@Body() body: CreateWhiteboardDto) {
    return this.whiteboardsService.create(body);
  }

  @Get()
  findAll(@Query() query: QueryWhiteboardDto) {
    return this.whiteboardsService.findPaged(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.whiteboardsService.findOne(id);
  }

  @Post(':id/versions')
  createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name?: string,
  ) {
    return this.whiteboardsService.createVersion(id, name);
  }

  @Get(':id/versions')
  getVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryWhiteboardDto,
  ) {
    return this.whiteboardsService.getVersions(id, query);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.whiteboardsService.restoreVersion(id, versionId);
  }
}
