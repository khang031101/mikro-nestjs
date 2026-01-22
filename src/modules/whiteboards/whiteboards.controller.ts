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
}
