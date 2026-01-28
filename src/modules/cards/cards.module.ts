import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardLink } from './entities/card-link.entity';
import { Card } from './entities/card.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Card, CardLink])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
