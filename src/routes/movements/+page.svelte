<script lang="ts">
  import { onMount } from "svelte";
  import type { Movement } from "../../interface/itemInterface";
  import type { Location } from "../../interface/locationInterface";
  import type { Category } from "../../interface/categoryInterface";
  import type { Item } from "../../interface/itemInterface";

  let movements: Movement[] = $state([]);
  let locations: Location[] = $state([]);
  let categories: Category[] = $state([]);
  let items: Item[] = $state([]);

  let filterCategory: string = $state("");
  let loadError: string | null = $state(null);

  let filteredMovements = $derived(
    filterCategory ? movements.filter(m => {
      const item = items.find(i => i.name === m.item_name);
      return item?.category === filterCategory;
    }) : movements
  );

  async function fetchMovements() {
    loadError = null;
    try {
      const res = await fetch("/api/movements");
      const result = await res.json();
      if (result.success) {
        movements = result.data;
      } else {
        loadError = result.error || "Gagal memuat data.";
      }
    } catch (err) {
      loadError = "Terjadi kesalahan jaringan.";
      console.error(err);
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch("/api/locations");
      const result = await res.json();
      if (result.success) {
        locations = result.data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      const result = await res.json();
      if (result.success) {
        categories = result.data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchItems() {
    try {
      const res = await fetch("/api/items");
      const result = await res.json();
      if (result.success) {
        items = result.data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  onMount(() => {
    fetchMovements();
    fetchLocations();
    fetchCategories();
    fetchItems();
  });

  // Build hierarchical location path (e.g., "Building A > Floor 1 > Room 101")
  function getLocationPath(locationId: string | null): string {
    if (!locationId || locationId === "") return "-";
    const parts: string[] = [];
    let currentId: string | null = locationId;
    while (currentId) {
      const loc = locations.find(l => l.id === currentId);
      if (loc) {
        parts.unshift(loc.name);
        currentId = loc.parent;
      } else {
        break;
      }
    }
    return parts.join(" > ") || "-";
  }

  function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId || categoryId === "") return "-";
    const found = categories.find(c => c.id === categoryId);
    return found ? found.name : "-";
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus riwayat movement ini?")) return;
    try {
      const res = await fetch(`/api/movements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      fetchMovements();
    } catch (err) {
      console.error(err);
    }
  }
</script>

<svelte:head>
    <title>Movement History</title>
</svelte:head>

<div class="movements-page">
    <header class="page-header">
        <h1 class="page-title">Movement History</h1>
        <span class="movement-count">{filteredMovements.length}{filterCategory ? ` of ${movements.length}` : ''} total</span>
    </header>

    <div class="filter-bar">
        <select
            class="filter-select"
            bind:value={filterCategory}
        >
            <option value="">All Categories</option>
            {#each categories as cat}
                <option value={cat.id}>{cat.name}</option>
            {/each}
        </select>
    </div>

    {#if loadError}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p class="empty-title">Failed to load</p>
            <p class="empty-subtitle">{loadError}</p>
            <button class="btn-retry" onclick={fetchMovements}>Try again</button>
        </div>
    {:else if filteredMovements.length === 0}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-2.25 0h-2.25m0 0v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v3.866m12.75 0v.958c0 .568.422 1.048.987 1.106a48.554 48.554 0 0010.026 0 1.106 1.106 0 00.987-1.106v-3.866m-12.75 0H5.625m0 0h2.25M5.625 15.75h2.25M5.625 11.25h2.25M11.25 11.25v2.25h-2.25M11.25 11.25H9.75" />
            </svg>
            <p class="empty-title">{filterCategory ? 'No movements in this category' : 'No movements yet'}</p>
            <p class="empty-subtitle">{filterCategory ? 'Try selecting a different category' : 'Movement history will appear here when items change location'}</p>
        </div>
    {:else}
        <ul class="movement-list" role="list">
            {#each filteredMovements as movement (movement.id)}
                <li class="movement-card">
                    <div class="movement-content">
                        <div class="movement-info">
                            <span class="movement-item">{movement.item_name}</span>
                            <span class="movement-category">Category: {getCategoryName(movement.category)}</span>
                            <div class="movement-route">
                                <span class="from-location">{getLocationPath(movement.from_location)}</span>
                                <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                                <span class="to-location">{getLocationPath(movement.to_location)}</span>
                            </div>
                            <div class="movement-meta">
                                <span class="movement-qty">Qty: {movement.quantity}</span>
                                <span class="movement-date">{formatDate(movement.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        class="delete-btn"
                        onclick={() => handleDelete(movement.id)}
                        aria-label="Delete movement record"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .movements-page {
        min-height: 100dvh;
        background: #fafaf9;
        padding-bottom: 32px;
    }

    .page-header {
        padding: 24px 16px 16px;
        background: #fff;
        border-bottom: 1px solid #e7e5e4;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .page-title {
        font-size: 24px;
        font-weight: 700;
        color: #1c1917;
        letter-spacing: -0.02em;
    }

    .movement-count {
        font-size: 13px;
        color: #78716c;
        margin-top: 2px;
        display: block;
    }

    .filter-bar {
        padding: 12px 16px;
        background: #fff;
        border-bottom: 1px solid #e7e5e4;
    }

    .filter-select {
        width: 100%;
        height: 40px;
        padding: 0 36px 0 12px;
        font-size: 14px;
        border: 1.5px solid #d6d3d1;
        border-radius: 8px;
        background: #fff;
        color: #1c1917;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
    }

    .filter-select:focus {
        outline: none;
        border-color: #d97706;
    }

    .empty-state {
        padding: 64px 32px;
        text-align: center;
    }

    .empty-icon {
        width: 48px;
        height: 48px;
        color: #d6d3d1;
        margin: 0 auto 16px;
    }

    .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: #44403c;
        margin: 0 0 4px;
    }

    .empty-subtitle {
        font-size: 14px;
        color: #a8a29e;
        margin: 0 0 16px;
    }

    .btn-retry {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 600;
        color: #d97706;
        background: transparent;
        border: 1.5px solid #d97706;
        border-radius: 8px;
        cursor: pointer;
        transition: background 150ms;
    }

    .btn-retry:hover {
        background: #fffbeb;
    }

    .movement-list {
        list-style: none;
        padding: 8px;
        margin: 0;
    }

    .movement-card {
        display: flex;
        align-items: stretch;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e7e5e4;
        overflow: hidden;
    }

    .movement-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        min-width: 0;
    }

    .movement-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .movement-item {
        font-size: 16px;
        font-weight: 600;
        color: #1c1917;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .movement-category {
        font-size: 13px;
        color: #78716c;
    }

    .movement-route {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .from-location,
    .to-location {
        font-size: 13px;
        color: #78716c;
    }

    .from-location {
        color: #ef4444;
    }

    .to-location {
        color: #22c55e;
    }

    .arrow-icon {
        width: 16px;
        height: 16px;
        color: #a8a29e;
        flex-shrink: 0;
    }

    .movement-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #a8a29e;
    }

    .movement-qty {
        font-weight: 500;
        color: #78716c;
    }

    .delete-btn {
        padding: 14px 16px;
        background: transparent;
        border: none;
        border-left: 1px solid #e7e5e4;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 150ms;
    }

    .delete-btn:hover {
        background: #fef2f2;
    }

    .delete-btn:active {
        background: #fee2e2;
    }

    .delete-btn:focus-visible {
        outline: 2px solid #f59e0b;
        outline-offset: -2px;
    }

    .delete-btn svg {
        width: 18px;
        height: 18px;
        color: #ef4444;
    }
</style>
