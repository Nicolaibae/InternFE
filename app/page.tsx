"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Category,
  CategorySummary,
  PostSummary,
  createCategory,
  createPost,
  deleteCategory,
  deletePost,
  fetchCategories,
  fetchPosts,
  updateCategory,
  updatePost,
} from "@/services/api";

type CategoryFormState = {
  id?: number;
  name: string;
  parentCategoryId: number | null;
};

type PostFormState = {
  id?: number;
  title: string;
  content: string;
  categories: number[];
};

type CategoryOption = {
  id: number;
  name: string;
  depth: number;
};

function flattenCategories(
  items: Category[],
  depth = 0,
  result: CategoryOption[] = [],
): CategoryOption[] {
  items.forEach((item) => {
    result.push({ id: item.id, name: item.name, depth });
    if (item.childrenCategories?.length) {
      flattenCategories(item.childrenCategories, depth + 1, result);
    }
  });
  return result;
}

type CategoryTreeProps = {
  items: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function CategoryTree({ items, onEdit, onDelete }: CategoryTreeProps) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">Chưa có danh mục nào.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded border border-neutral-200 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-neutral-800">{item.name}</p>
              {item.parentCategoryId && (
                <p className="text-xs text-neutral-500">
                  Thuộc danh mục ID {item.parentCategoryId}
                </p>
              )}
              {!!item.childrenCategories?.length && (
                <p className="text-xs text-neutral-500">
                  Có {item.childrenCategories.length} danh mục con
                </p>
              )}
              {!!item.posts?.length && (
                <p className="text-xs text-neutral-500">
                  Gắn với {item.posts.length} bài viết
                </p>
              )}
            </div>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="text-blue-600 hover:underline"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="text-red-600 hover:underline"
              >
                Xoá
              </button>
            </div>
          </div>
          {item.childrenCategories && item.childrenCategories.length > 0 && (
            <div className="mt-3 border-l border-neutral-200 pl-4">
              <CategoryTree
                items={item.childrenCategories}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function CategoryCheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: Category[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const renderTree = (items: Category[], depth = 0) => (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span style={{ marginLeft: depth * 8 }}>{item.name}</span>
          </label>
          {item.childrenCategories?.length ? (
            <div className="ml-4 border-l border-dashed border-neutral-300 pl-4">
              {renderTree(item.childrenCategories, depth + 1)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );

  if (!options.length) {
    return <p className="text-sm text-neutral-500">Chưa có danh mục.</p>;
  }

  return renderTree(options);
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: "",
    parentCategoryId: null,
  });

  const [postForm, setPostForm] = useState<PostFormState>({
    title: "",
    content: "",
    categories: [],
  });

  const categoryOptions = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  const refreshCategories = async () => {
    setLoadingCategories(true);
    setCategoryError(null);
    try {
      const data = await fetchCategories();
      setCategories(data.data);
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Không thể tải danh mục",
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  const refreshPosts = async () => {
    setLoadingPosts(true);
    setPostError(null);
    try {
      const data = await fetchPosts();
      setPosts(data.data);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Không thể tải bài viết");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    void refreshCategories();
    void refreshPosts();
  }, []);

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      setCategoryError("Tên danh mục không được để trống");
      return;
    }

    try {
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, {
          name: categoryForm.name.trim(),
          parentCategoryId: categoryForm.parentCategoryId,
        });
      } else {
        await createCategory({
          name: categoryForm.name.trim(),
          parentCategoryId: categoryForm.parentCategoryId,
        });
      }
      await refreshCategories();
      setCategoryForm({ name: "", parentCategoryId: null });
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Không thể lưu danh mục",
      );
    }
  };

  const handlePostSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postForm.title.trim()) {
      setPostError("Tiêu đề bài viết không được để trống");
      return;
    }
    if (!postForm.content.trim()) {
      setPostError("Nội dung bài viết không được để trống");
      return;
    }

    try {
      if (postForm.id) {
        await updatePost(postForm.id, {
          title: postForm.title.trim(),
          content: postForm.content.trim(),
          categories: postForm.categories,
        });
      } else {
        await createPost({
          title: postForm.title.trim(),
          content: postForm.content.trim(),
          categories: postForm.categories,
        });
      }
      await refreshPosts();
      setPostForm({ title: "", content: "", categories: [] });
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Không thể lưu bài viết");
    }
  };

  const onEditCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      parentCategoryId: category.parentCategoryId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá danh mục "${category.name}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteCategory(category.id);
      await refreshCategories();
      await refreshPosts();
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Không thể xoá danh mục",
      );
    }
  };

  const onEditPost = (post: PostSummary) => {
    setPostForm({
      id: post.id,
      title: post.title,
      content: post.content,
      categories: post.categories?.map((category) => category.id) ?? [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDeletePost = async (post: PostSummary) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá bài viết "${post.title}"?`,
    );
    if (!confirmed) return;
    try {
      await deletePost(post.id);
      await refreshPosts();
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Không thể xoá bài viết");
    }
  };

  const handleResetCategory = () => {
    setCategoryForm({ name: "", parentCategoryId: null });
    setCategoryError(null);
  };

  const handleResetPost = () => {
    setPostForm({ title: "", content: "", categories: [] });
    setPostError(null);
  };

  const parentOptions = categoryOptions.filter(
    (option) => option.id !== categoryForm.id,
  );

  const togglePostCategory = (id: number) => {
    setPostForm((prev) => {
      const exists = prev.categories.includes(id);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((categoryId) => categoryId !== id)
          : [...prev.categories, id],
      };
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">
          Quản lý danh mục &amp; bài viết
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tạo, chỉnh sửa và gán bài viết vào nhiều danh mục khác nhau.
        </p>
      </header>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            {categoryForm.id ? "Cập nhật danh mục" : "Tạo danh mục mới"}
          </h2>
          <form className="mt-4 space-y-4" onSubmit={handleCategorySubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700" htmlFor="categoryName">
                Tên danh mục
              </label>
              <input
                id="categoryName"
                type="text"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                placeholder="Ví dụ: Tin tức"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700" htmlFor="parentCategory">
                Danh mục cha (tuỳ chọn)
              </label>
              <select
                id="parentCategory"
                value={categoryForm.parentCategoryId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setCategoryForm((prev) => ({
                    ...prev,
                    parentCategoryId: value ? Number(value) : null,
                  }));
                }}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
              >
                <option value="">Không có</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {"".padStart(option.depth * 2, "·")} {option.name}
                  </option>
                ))}
              </select>
            </div>
            {categoryError && (
              <p className="text-sm text-red-600">{categoryError}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={loadingCategories}
              >
                {categoryForm.id ? "Lưu thay đổi" : "Tạo danh mục"}
              </button>
              <button
                type="button"
                onClick={handleResetCategory}
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Huỷ
              </button>
            </div>
          </form>
          <div className="mt-6 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Danh sách danh mục</h3>
              {loadingCategories && (
                <span className="text-xs text-neutral-500">Đang tải...</span>
              )}
            </div>
            <CategoryTree
              items={categories}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            {postForm.id ? "Cập nhật bài viết" : "Tạo bài viết mới"}
          </h2>
          <form className="mt-4 space-y-4" onSubmit={handlePostSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700" htmlFor="postTitle">
                Tiêu đề
              </label>
              <input
                id="postTitle"
                type="text"
                value={postForm.title}
                onChange={(event) =>
                  setPostForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                placeholder="Ví dụ: Sự kiện nổi bật"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700" htmlFor="postContent">
                Nội dung
              </label>
              <textarea
                id="postContent"
                rows={6}
                value={postForm.content}
                onChange={(event) =>
                  setPostForm((prev) => ({ ...prev, content: event.target.value }))
                }
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                placeholder="Nhập nội dung bài viết"
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">
                Danh mục (có thể chọn nhiều)
              </span>
              <div className="max-h-48 overflow-auto rounded border border-neutral-200 p-3">
                <CategoryCheckboxList
                  options={categories}
                  selected={postForm.categories}
                  onToggle={togglePostCategory}
                />
              </div>
            </div>
            {postError && <p className="text-sm text-red-600">{postError}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={loadingPosts}
              >
                {postForm.id ? "Lưu bài viết" : "Tạo bài viết"}
              </button>
              <button
                type="button"
                onClick={handleResetPost}
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Huỷ
              </button>
            </div>
          </form>
          <div className="mt-6 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Danh sách bài viết</h3>
              {loadingPosts && (
                <span className="text-xs text-neutral-500">Đang tải...</span>
              )}
            </div>
            {posts.length === 0 ? (
              <p className="text-sm text-neutral-500">Chưa có bài viết nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-neutral-700">Tiêu đề</th>
                      <th className="px-3 py-2 font-semibold text-neutral-700">Danh mục</th>
                      <th className="px-3 py-2 font-semibold text-neutral-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td className="px-3 py-3 align-top">
                          <p className="font-medium text-neutral-900">{post.title}</p>
                          <p className="mt-1 text-xs text-neutral-500 max-h-24 overflow-hidden">
                            {post.content}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {post.categories && post.categories.length > 0 ? (
                            <ul className="space-y-1">
                              {post.categories.map((category: CategorySummary) => (
                                <li
                                  key={`${post.id}-${category.id}`}
                                  className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
                                >
                                  {category.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-neutral-500">
                              Chưa gán danh mục
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-col gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => onEditPost(post)}
                              className="text-blue-600 hover:underline"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePost(post)}
                              className="text-red-600 hover:underline"
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
