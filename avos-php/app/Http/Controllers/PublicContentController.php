<?php
declare(strict_types=1);
namespace AvOS\Http\Controllers;

use AvOS\Api\ApiResult;
use AvOS\Content\ContentType;
use AvOS\Domain\Content\PublicContentService;
use AvOS\Http\Request;

/**
 * The public content controller (Phase 3E §3E.16).
 *
 * Mounted only under `/api/v1/content/*`. Nothing here takes an internal id,
 * nothing here accepts a status filter, and nothing here can reach the
 * management services — it holds one dependency, and that dependency only
 * knows how to read published rows.
 *
 * The path split is the security boundary and it is testable: no route under
 * `/api/v1/pages`, `/projects`, `/articles` or `/experience` is public, and
 * every route under `/api/v1/content` is.
 */
final class PublicContentController
{
    public function __construct(private readonly PublicContentService $content) {}

    /** GET /api/v1/content — published counts, no rows. */
    public function summary(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->summary(), $r->requestId);
    }

    /** GET /api/v1/content/pages */
    public function pages(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->index(ContentType::PAGE, $r->query), $r->requestId);
    }

    public function page(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->bySlug(ContentType::PAGE, $r->param('slug')), $r->requestId);
    }

    public function projects(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->index(ContentType::PROJECT, $r->query), $r->requestId);
    }

    public function project(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->bySlug(ContentType::PROJECT, $r->param('slug')), $r->requestId);
    }

    public function articles(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->index(ContentType::ARTICLE, $r->query), $r->requestId);
    }

    public function article(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->bySlug(ContentType::ARTICLE, $r->param('slug')), $r->requestId);
    }

    public function experience(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->experience($r->query), $r->requestId);
    }

    /** GET /api/v1/content/resolve?path=/some-clean-url */
    public function resolve(Request $r): ApiResult
    {
        return ApiResult::ok($this->content->resolve($r->queryValue('path')), $r->requestId);
    }
}
