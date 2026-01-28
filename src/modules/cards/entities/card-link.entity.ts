import { CoreEntity } from '@/common/entities/core.entity';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Card } from './card.entity';

@Entity()
export class CardLink extends CoreEntity {
  @Property()
  label!: string;

  @Property()
  url!: string;

  // Type of link: social, custom, file, etc.
  @Property({ default: 'custom' })
  type: string = 'custom';

  // Icon identifier (e.g., 'zalo', 'facebook', 'linkedin')
  @Property({ nullable: true })
  iconKey?: string;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: 0 })
  order: number = 0;

  @ManyToOne(() => Card, { deleteRule: 'cascade' })
  card!: Card;

  constructor(partial: Partial<CardLink>) {
    super();
    Object.assign(this, partial);
  }
}
