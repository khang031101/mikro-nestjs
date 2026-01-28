import { CoreEntity } from '@/common/entities/core.entity';
import { User } from '@/entities/user.entity';
import {
  Cascade,
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { CardLink } from './card-link.entity';
import { CardTheme } from '../cards.interface';

@Entity()
export class Card extends CoreEntity {
  @Property({ unique: true })
  slug!: string;

  @Property()
  displayName!: string;

  @Property({ nullable: true })
  jobTitle?: string;

  @Property({ nullable: true })
  company?: string;

  @Property({ type: 'text', nullable: true })
  bio?: string;

  @Property({ nullable: true })
  avatarUrl?: string;

  @Property({ nullable: true })
  coverUrl?: string;

  // Personal Contact
  @Property({ nullable: true })
  phoneNumber?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  website?: string;

  // Vietnam Market Specific: VietQR
  @Property({ nullable: true })
  bankName?: string;

  @Property({ nullable: true })
  bankAccountName?: string;

  @Property({ nullable: true })
  bankAccountNumber?: string;

  // Customization
  @Property({ type: 'json', nullable: true })
  themeConfig?: CardTheme;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: 0 })
  viewCount: number = 0;

  @ManyToOne(() => User)
  user!: User;

  @OneToMany(() => CardLink, (link) => link.card, { cascade: [Cascade.ALL] })
  links = new Collection<CardLink>(this);

  constructor(partial: Partial<Card>) {
    super();
    Object.assign(this, partial);
  }
}
