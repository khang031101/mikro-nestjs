import { Member } from '@/entities/member.entity';
import { Role } from '@/entities/role.entity';
import { User } from '@/entities/user.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityManager,
  EntityRepository,
  FilterQuery,
} from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CreateMemberDto, QueryMemberDto, UpdateMemberDto } from './dtos';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: EntityRepository<Member>,
    @InjectRepository(Role)
    private readonly roleRepository: EntityRepository<Role>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async create(dto: CreateMemberDto): Promise<Member> {
    const tenantId = this.cls.get('tenantId');

    // Verify user exists
    const user = await this.userRepository.findOne({ id: dto.userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify role exists and belongs to this tenant
    const role = await this.roleRepository.findOne({
      id: dto.roleId,
      tenantId: tenantId ?? '',
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if membership already exists
    const existingMember = await this.memberRepository.findOne({
      user: dto.userId,
      tenantId: tenantId ?? '',
    });
    if (existingMember) {
      throw new BadRequestException('User is already a member of this tenant');
    }

    const member = new Member({
      tenantId: tenantId ?? '',
      isActive: dto.isActive ?? true,
    });
    member.user = user;
    member.role = role;

    await this.em.persistAndFlush(member);
    return member;
  }

  async findPaged(query: QueryMemberDto) {
    const where: FilterQuery<Member> = {};

    if (query.userId) {
      where.user = query.userId;
    }
    if (query.roleId) {
      where.role = query.roleId;
    }

    const [items, count] = await this.memberRepository.findAndCount(where, {
      limit: query.take,
      offset: query.skip,
      orderBy: { createdAt: 'DESC' },
      populate: ['user', 'role'],
    });

    return {
      items,
      count,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne(
      { id },
      { populate: ['user', 'role'] },
    );
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    const tenantId = this.cls.get('tenantId');

    if (dto.roleId !== undefined) {
      const role = await this.roleRepository.findOne({
        id: dto.roleId,
        tenantId: tenantId ?? '',
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      member.role = role;
    }

    if (dto.isActive !== undefined) {
      member.isActive = dto.isActive;
    }

    await this.em.flush();
    return member;
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.em.removeAndFlush(member);
  }
}
