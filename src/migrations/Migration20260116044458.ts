import { Migration } from '@mikro-orm/migrations';

export class Migration20260116044458 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "workspace" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, constraint "workspace_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "document" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "tenant_id" uuid not null, "title" varchar(255) not null, "snapshot" jsonb not null, "workspace_id" varchar(255) not null, constraint "document_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "document_version" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "tenant_id" uuid not null, "document_id" varchar(255) not null, "update_binary" bytea not null, "version" int not null, constraint "document_version_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "workspace_member" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "tenant_id" uuid not null, "workspace_id" varchar(255) not null, "user_id" varchar(255) not null, "role" text check ("role" in ('OWNER', 'ADMIN', 'MEMBER')) not null default 'MEMBER', "is_active" boolean not null default true, constraint "workspace_member_pkey" primary key ("id"));`,
    );

    this.addSql(
      `alter table "document" add constraint "document_workspace_id_foreign" foreign key ("workspace_id") references "workspace" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "document_version" add constraint "document_version_document_id_foreign" foreign key ("document_id") references "document" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "workspace_member" add constraint "workspace_member_workspace_id_foreign" foreign key ("workspace_id") references "workspace" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "workspace_member" add constraint "workspace_member_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "user" add column "is_active" boolean not null default true;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "document" drop constraint "document_workspace_id_foreign";`,
    );

    this.addSql(
      `alter table "workspace_member" drop constraint "workspace_member_workspace_id_foreign";`,
    );

    this.addSql(
      `alter table "document_version" drop constraint "document_version_document_id_foreign";`,
    );

    this.addSql(`drop table if exists "workspace" cascade;`);

    this.addSql(`drop table if exists "document" cascade;`);

    this.addSql(`drop table if exists "document_version" cascade;`);

    this.addSql(`drop table if exists "workspace_member" cascade;`);

    this.addSql(`alter table "user" drop column "is_active";`);
  }
}
