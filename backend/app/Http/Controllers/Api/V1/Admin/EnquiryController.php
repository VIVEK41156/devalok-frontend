<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EnquiryResource;
use App\Models\ContactEnquiry;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class EnquiryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(ContactEnquiry::STATUSES)],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);
        $q = ContactEnquiry::query()->with(['sculpture', 'handler'])->latest('id');
        if ($term = $request->query('search')) {
            $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
            $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('subject', 'like', $like));
        }
        $q->when($request->query('status'), fn ($w, $s) => $w->where('status', $s));

        return EnquiryResource::collection($q->paginate((int) $request->query('per_page', 20))->withQueryString());
    }

    public function show(ContactEnquiry $enquiry): EnquiryResource
    {
        return new EnquiryResource($enquiry->load(['sculpture', 'handler']));
    }

    public function update(Request $request, ContactEnquiry $enquiry): EnquiryResource
    {
        $data = $request->validate(['status' => ['required', Rule::in(ContactEnquiry::STATUSES)]]);
        $enquiry->update(['status' => $data['status'], 'handled_by' => $request->user()->id]);
        Activity::record('enquiry.status', $enquiry, "Marked enquiry #{$enquiry->id} as {$data['status']}");

        return new EnquiryResource($enquiry->load(['sculpture', 'handler']));
    }

    public function destroy(ContactEnquiry $enquiry): JsonResponse
    {
        $id = $enquiry->id;
        $enquiry->delete();
        Activity::record('enquiry.deleted', null, "Deleted enquiry #{$id}");

        return response()->json(['message' => 'Enquiry deleted.']);
    }
}
