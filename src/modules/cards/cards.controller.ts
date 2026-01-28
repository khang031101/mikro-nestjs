import { CurrentUserId } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto, QueryCardDto, UpdateCardDto } from './dtos';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() body: CreateCardDto) {
    return this.cardsService.create(userId, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: QueryCardDto) {
    return this.cardsService.findPaged(query);
  }

  // Public endpoint to view a card by slug
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.cardsService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCardDto,
  ) {
    return this.cardsService.update(id, userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.remove(id, userId);
  }
}
