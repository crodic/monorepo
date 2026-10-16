import { describe, expect, it } from "vitest";
import {
  NestjsPaginateQueryBuilder,
  PaginateQueryBuilder,
} from "./nestjs-paginate-query-builder";
import { RestQueryBuilder } from "./rest-query-builder";

describe("NestJS Paginate Query Builder", () => {
  it("should build basic pagination and sort params", () => {
    const qb = new PaginateQueryBuilder()
      .page(2)
      .limit(10)
      .sortBy("createdAt", "DESC");

    const qs = qb.toQueryString();
    expect(qs).toContain("page=2");
    expect(qs).toContain("limit=10");
    expect(qs).toContain("sort=createdAt:DESC");
  });

  it("should format filters with operators correctly", () => {
    const qb = new PaginateQueryBuilder()
      .eq("status", "active")
      .in("roles", ["admin", "manager"])
      .btw("age", [18, 65]);

    const qs = qb.toQueryString();
    expect(qs).toContain("filter.status=$eq:active");
    expect(qs).toContain("filter.roles=$in:admin,manager");
    expect(qs).toContain("filter.age=$btw:18,65");
  });

  it("should handle search and searchBy properly", () => {
    const qb = new NestjsPaginateQueryBuilder()
      .search("john")
      .searchBy(["email", "name"]);

    const qs = qb.toQueryString();
    expect(qs).toContain("search=john");
    expect(qs).toContain("searchBy=email");
    expect(qs).toContain("searchBy=name");
  });
});

describe("REST Query Builder", () => {
  it("should format filters, sorts, and includes in REST style", () => {
    const qb = new RestQueryBuilder()
      .filter("status", "active")
      .filter("category", ["electronics", "books"])
      .sortBy("createdAt", "desc")
      .sortBy("title", "asc")
      .include("author", "comments")
      .fields("id", "title", "price")
      .page(1)
      .limit(20);

    const qs = qb.toQueryString();
    expect(qs).toContain("filter[status]=active");
    expect(qs).toContain("filter[category]=electronics,books");
    expect(qs).toContain("sort=-createdAt,title");
    expect(qs).toContain("include=author,comments");
    expect(qs).toContain("fields=id,title,price");
    expect(qs).toContain("page=1");
    expect(qs).toContain("limit=20");
  });

  it("should support scoped sparse fields", () => {
    const qb = new RestQueryBuilder()
      .fieldsFor("users", ["id", "name"])
      .fieldsFor("posts", ["id", "title"]);

    const qs = qb.toQueryString();
    expect(qs).toContain("fields[users]=id,name");
    expect(qs).toContain("fields[posts]=id,title");
  });

  it("should support bracket pagination if enabled", () => {
    const qb = new RestQueryBuilder(undefined, { bracketPagination: true })
      .page(3)
      .limit(50);

    const qs = qb.toQueryString();
    expect(qs).toContain("page[number]=3");
    expect(qs).toContain("page[size]=50");
  });

  it("should support bracket array filtering if enabled", () => {
    const qb = new RestQueryBuilder(undefined, {
      arrayFormat: "bracket",
    }).filter("status", ["active", "pending"]);

    const qs = qb.toQueryString();
    expect(qs).toContain("filter[status][]=active&filter[status][]=pending");
  });
});
