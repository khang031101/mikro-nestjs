import { BaseEntity, PrimaryKey, Property } from '@mikro-orm/core';
import { v7 } from 'uuid';

export abstract class CoreEntity extends BaseEntity {
  @PrimaryKey()
  id = v7();

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
