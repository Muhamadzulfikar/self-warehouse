<script lang="ts">
  import { onMount } from "svelte";
  import type { Item } from "../../interface/itemInterface";
  import type { Category } from "../../interface/categoryInterface";
  import type { Location } from "../../interface/locationInterface";

  let items: Item[] = $state([]);
  let categories: Category[] = $state([]);
  let locations: Location[] = $state([]);

  let name = $state("");
  let category: string = $state("");
  let location: string = $state("");
  let quantity: number = $state(0);
  let editId: string | null = $state(null);

  let filterCategory: string = $state("");
  let showSheet = $state(false);
  let loadError: string | null = $state(null);

  let filteredItems = $derived(
    filterCategory ? items.filter(item => item.category === filterCategory) : items
  );

  async function fetchItems() {
    loadError = null;
    try {
      const res = await fetch("/api/items");
      const result = await res.json();
      if (result.success) {
        items = result.data;
      } else {
        loadError = result.error || "Gagal memuat data.";
      }
    } catch (err) {
      loadError = "Terjadi kesalahan jaringan.";
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

  onMount(() => {
    fetchItems();
    fetchCategories();
    fetchLocations();
  });

  // Build hierarchical location path (e.g., "Building A > Floor 1 > Room 101")
  function getLocationPath(locationId: string | null): string {
    if (!locationId) return "Unknown";
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
    return parts.join(" > ") || "Unknown";
  }

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return "Unknown";
    const found = categories.find(c => c.id === categoryId);
    return found ? found.name : "Unknown";
  }

  async function handleSubmit() {
    if (!name.trim()) {
      alert("Nama item wajib diisi");
      return;
    }
    if (!category) {
      alert("Kategori wajib dipilih");
      return;
    }
    if (!location) {
      alert("Lokasi wajib dipilih");
      return;
    }
    if (quantity <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }

    try {
      if (editId) {
        // Get old item data to check if location changed
        const oldItem = items.find(i => i.id === editId);
        const oldLocation = oldItem?.location || "";

        const res = await fetch(`/api/items/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, category, location, quantity })
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Gagal mengupdate data");
        }

        // If location changed, create a movement record
        if (oldLocation && oldLocation !== location) {
          await fetch("/api/movements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              item_name: name,
              from_location: oldLocation,
              to_location: location,
              quantity: quantity
            })
          });
        }

        editId = null;
      } else {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, category, location, quantity })
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Gagal menyimpan data");
        }
      }

      name = "";
      category = "";
      location = "";
      quantity = 0;
      closeSheet();
      fetchItems();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  function handleEdit(item: Item) {
    name = item.name;
    category = item.category;
    location = item.location;
    quantity = item.quantity;
    editId = item.id;
    showSheet = true;
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus item ini?")) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  }

  function openAddSheet() {
    name = "";
    category = "";
    location = "";
    quantity = 0;
    editId = null;
    showSheet = true;
  }

  function closeSheet() {
    showSheet = false;
    name = "";
    category = "";
    location = "";
    quantity = 0;
    editId = null;
  }
</script>

<svelte:head>
    <title>Items</title>
</svelte:head>

<div class="items-page">
    <header class="page-header">
        <h1 class="page-title">Items</h1>
        <span class="item-count">{filteredItems.length}{filterCategory ? ` of ${items.length}` : ''} items</span>
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
            <button class="btn-retry" onclick={fetchItems}>Try again</button>
        </div>
    {:else if filteredItems.length === 0}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p class="empty-title">{filterCategory ? 'No items in this category' : 'No items yet'}</p>
            <p class="empty-subtitle">{filterCategory ? 'Try selecting a different category' : 'Add your first item to get started'}</p>
        </div>
    {:else}
        <ul class="item-list" role="list">
            {#each filteredItems as item (item.id)}
                <li class="item-card">
                    <button
                        class="item-content"
                        onclick={() => handleEdit(item)}
                        aria-label="Edit {item.name}"
                    >
                        <div class="item-info">
                            <span class="item-name">{item.name}</span>
                            <span class="item-category">Category: {getCategoryName(item.category)}</span>
                            <span class="item-location">Location: {getLocationPath(item.location)}</span>
                            <span class="item-quantity">Qty: {item.quantity}</span>
                        </div>
                        <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button
                        class="delete-btn"
                        onclick={() => handleDelete(item.id)}
                        aria-label="Delete {item.name}"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}

    <button class="fab" onclick={openAddSheet} aria-label="Add item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    </button>

    {#if showSheet}
        <div class="sheet-overlay" onclick={closeSheet}></div>
        <div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
            <div class="sheet-handle"></div>
            <h2 id="sheet-title" class="sheet-title">
                {editId ? 'Edit Item' : 'New Item'}
            </h2>

            <form class="item-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div class="form-group">
                    <label class="form-label" for="item-name">Item Name</label>
                    <input
                        id="item-name"
                        type="text"
                        class="form-input"
                        bind:value={name}
                        placeholder="e.g., Laptop, Chair, Box"
                        autocomplete="off"
                    />
                </div>

                <div class="form-group">
                    <label class="form-label" for="item-category">Category</label>
                    <select
                        id="item-category"
                        class="form-select"
                        bind:value={category}
                    >
                        <option value="">Select category</option>
                        {#each categories as cat}
                            <option value={cat.id}>{cat.name}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="item-location">Location</label>
                    <select
                        id="item-location"
                        class="form-select"
                        bind:value={location}
                    >
                        <option value="">Select location</option>
                        {#each locations as loc}
                            <option value={loc.id}>{getLocationPath(loc.id)}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="item-quantity">Quantity</label>
                    <input
                        id="item-quantity"
                        type="number"
                        class="form-input"
                        bind:value={quantity}
                        min="1"
                        placeholder="1"
                    />
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick={closeSheet}>Cancel</button>
                    <button type="submit" class="btn-primary">
                        {editId ? 'Save Changes' : 'Add Item'}
                    </button>
                </div>
            </form>
        </div>
    {/if}
</div>

<style>
    .items-page {
        min-height: 100dvh;
        background: #fafaf9;
        padding-bottom: 96px;
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

    .item-count {
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

    .item-list {
        list-style: none;
        padding: 8px;
        margin: 0;
    }

    .item-card {
        display: flex;
        align-items: stretch;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e7e5e4;
        overflow: hidden;
    }

    .item-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        min-width: 0;
    }

    .item-content:focus-visible {
        outline: 2px solid #f59e0b;
        outline-offset: -2px;
        border-radius: 8px;
    }

    .item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .item-name {
        font-size: 16px;
        font-weight: 600;
        color: #1c1917;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .item-category,
    .item-location,
    .item-quantity {
        font-size: 13px;
        color: #78716c;
    }

    .edit-icon {
        width: 18px;
        height: 18px;
        color: #a8a29e;
        flex-shrink: 0;
        margin-left: 12px;
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

    .fab {
        position: fixed;
        bottom: 24px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: #d97706;
        color: #fff;
        border: none;
        box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 150ms, box-shadow 150ms;
    }

    .fab:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(217, 119, 6, 0.5);
    }

    .fab:active {
        transform: scale(0.95);
    }

    .fab:focus-visible {
        outline: 3px solid #fbbf24;
        outline-offset: 2px;
    }

    .fab svg {
        width: 24px;
        height: 24px;
    }

    .sheet-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 40;
        animation: fade-in 150ms ease-out;
    }

    .bottom-sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        border-radius: 20px 20px 0 0;
        padding: 12px 20px 32px;
        z-index: 50;
        animation: slide-up 200ms ease-out;
    }

    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }

    .sheet-handle {
        width: 36px;
        height: 4px;
        background: #d6d3d1;
        border-radius: 2px;
        margin: 0 auto 16px;
    }

    .sheet-title {
        font-size: 20px;
        font-weight: 700;
        color: #1c1917;
        margin: 0 0 24px;
        letter-spacing: -0.01em;
    }

    .item-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-label {
        font-size: 14px;
        font-weight: 600;
        color: #44403c;
    }

    .form-input,
    .form-select {
        height: 48px;
        padding: 0 14px;
        font-size: 16px;
        border: 1.5px solid #d6d3d1;
        border-radius: 10px;
        background: #fff;
        color: #1c1917;
        transition: border-color 150ms, box-shadow 150ms;
    }

    .form-select {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 20px;
        padding-right: 40px;
    }

    .form-input::placeholder {
        color: #a8a29e;
    }

    .form-input:focus,
    .form-select:focus {
        outline: none;
        border-color: #d97706;
        box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
    }

    .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 8px;
    }

    .btn-secondary,
    .btn-primary {
        flex: 1;
        height: 50px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: background 150ms, transform 100ms;
    }

    .btn-secondary {
        background: #f5f5f4;
        color: #44403c;
    }

    .btn-secondary:hover {
        background: #e7e5e4;
    }

    .btn-secondary:active {
        transform: scale(0.98);
    }

    .btn-primary {
        background: #d97706;
        color: #fff;
    }

    .btn-primary:hover {
        background: #b45309;
    }

    .btn-primary:active {
        transform: scale(0.98);
    }

    .btn-secondary:focus-visible,
    .btn-primary:focus-visible {
        outline: 2px solid #f59e0b;
        outline-offset: 2px;
    }
</style>
