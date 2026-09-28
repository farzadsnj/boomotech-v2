"use client";

import { FormEvent, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { productCategories } from "@/content/products";

export function ShopSearch({ query, category }: { query: string; category: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const nextQuery = String(data.get("q") ?? "").trim();
    const nextCategory = String(data.get("category") ?? "all");
    if (nextQuery) params.set("q", nextQuery);
    if (nextCategory !== "all") params.set("category", nextCategory);
    startTransition(() => router.push(`/shop${params.size ? `?${params}` : ""}`));
  }

  function clear() {
    formRef.current?.reset();
    startTransition(() => router.push("/shop"));
  }

  return (
    <form className="shop-search" onSubmit={submit} ref={formRef} role="search">
      <div className="shop-search__field">
        <label htmlFor="shop-category">Category</label>
        <select defaultValue={category} id="shop-category" name="category">
          <option value="all">All categories</option>
          {productCategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </div>
      <div className="shop-search__field shop-search__field--query">
        <label htmlFor="shop-query">Search products</label>
        <input defaultValue={query} id="shop-query" name="q" placeholder="Search routers, laptops, cameras…" type="search" />
      </div>
      <button className="shop-search__submit" disabled={isPending} type="submit">{isPending ? "Searching…" : "Search"}</button>
      {query || category !== "all" ? <button className="shop-search__clear" onClick={clear} type="button">Clear search</button> : null}
      <span aria-live="polite" className="sr-only">{isPending ? "Updating product results" : ""}</span>
    </form>
  );
}
