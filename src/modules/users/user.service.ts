import { User } from '@/entities/user.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { QueryUserDto } from './dtos/query-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async findPaged(query: QueryUserDto) {
    const qb = this.userRepository.createQueryBuilder('u');

    const [items, total] = await qb
      .offset(query.skip)
      .limit(query.take)
      .getResultAndCount();

    return {
      items,
      total,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }
}
