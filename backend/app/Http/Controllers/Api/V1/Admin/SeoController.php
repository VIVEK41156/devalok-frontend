<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Page;
use App\Models\Sculpture;
use Illuminate\Http\JsonResponse;

/** Read-only SEO overview; edits go through the page/category/sculpture endpoints. */
class SeoController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $row = fn (string $type, $m, string $title, string $path) => [
            'type' => $type,
            'id' => $m->id,
            'name' => $title,
            'path' => $path,
            'seo_title' => $m->seo_title,
            'seo_description' => $m->seo_description,
            'missing' => array_values(array_filter([
                $m->seo_title ? null : 'title',
                $m->seo_description ? null : 'description',
            ])),
        ];

        $pages = Page::query()->orderBy('id')->get()->map(fn ($p) => $row('page', $p, $p->title, $p->slug === 'home' ? '/' : '/'.$p->slug));
        $cats = Category::query()->ordered()->get()->map(fn ($c) => $row('category', $c, $c->name, '/products#'.$c->slug));
        $sculptures = Sculpture::query()->ordered()->get()->map(fn ($s) => $row('sculpture', $s, $s->title, '/gallery'));

        return response()->json(['data' => $pages->concat($cats)->concat($sculptures)->values()]);
    }
}
