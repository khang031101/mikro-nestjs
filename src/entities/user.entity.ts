import { CoreEntity } from '@/common/entities';
import {
  BeforeCreate,
  Collection,
  Entity,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { hash } from 'bcryptjs';
import { Member } from './member.entity';

@Entity()
export class User extends CoreEntity {
  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true, hidden: true })
  password?: string;

  @Property({ nullable: true })
  googleId?: string;

  @Property({ nullable: true })
  avatarUrl?: string;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: false, hidden: true })
  isAdmin: boolean = false;

  @OneToMany(() => Member, (member) => member.user)
  memberships = new Collection<Member>(this);

  @BeforeCreate()
  async hashPassword() {
    if (this.password) {
      this.password = await hash(this.password, 10);
    }
  }

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}
