const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(message?.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export interface CategoryModel {
  id: number;
  name: string;
  parentCategoryId: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category extends CategoryModel {
  childrenCategories?: Category[];
  posts?: PostSummary[];
}

export interface CategoryListResponse {
  data: Category[];
  totalItem: number;
}

export interface PostSummary {
  id: number;
  title: string;
  content: string;
  categories: CategoryModel[];
}

export interface PostListResponse {
  data: PostSummary[];
  totalItem: number;
}

export async function fetchCategories(
  parentCategoryId?: number,
): Promise<CategoryListResponse> {
  const url = new URL(`${API_BASE_URL}/category`);
  if (parentCategoryId !== undefined) {
    url.searchParams.set("parentCategoryId", String(parentCategoryId));
  }

  return request<CategoryListResponse>(url.toString());
}

export async function createCategory(data: {
  name: string;
  parentCategoryId?: number | null;
}): Promise<Category> {
  return request<Category>(`${API_BASE_URL}/category`, {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      parentCategoryId: data.parentCategoryId ?? null,
    }),
  });
}

export async function updateCategory(
  id: number,
  data: { name: string; parentCategoryId?: number | null },
): Promise<Category> {
  return request<Category>(`${API_BASE_URL}/category/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: data.name,
      parentCategoryId: data.parentCategoryId ?? null,
    }),
  });
}

export async function deleteCategory(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`${API_BASE_URL}/category/${id}`, {
    method: "DELETE",
  });
}

export async function fetchPosts(): Promise<PostListResponse> {
  return request<PostListResponse>(`${API_BASE_URL}/post`);
}

export async function createPost(data: {
  title: string;
  content: string;
  categories?: number[];
}): Promise<PostSummary> {
  return request<PostSummary>(`${API_BASE_URL}/post`, {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      categories: data.categories ?? [],
    }),
  });
}

export async function updatePost(
  id: number,
  data: { title: string; content: string; categories?: number[] },
): Promise<PostSummary> {
  return request<PostSummary>(`${API_BASE_URL}/post/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      categories: data.categories ?? [],
    }),
  });
}

export async function deletePost(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`${API_BASE_URL}/post/${id}`, {
    method: "DELETE",
  });
}
