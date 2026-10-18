<script lang="ts">
  import { onMount } from "svelte";
  import type { Location } from "../../interface/locationInterface";

  let locations: Location[] = $state([]);
  let name = $state("");
  let parent: string | null = $state(null);
  let editId: string | null = $state(null);

  let showSheet = $state(false);
  let loadError: string | null = $state(null);

  async function fetchLocations() {
    loadError = null;
    try {
      const res = await fetch("/api/locations");
      const result = await res.json();
      if (result.success) {
        locations = result.data;
      } else {
        loadError = result.error || "Gagal memuat data.";
      }
    } catch (err) {
      loadError = "Terjadi kesalahan jaringan.";
      console.error(err);
    }
  }

  onMount(() => {
    fetchLocations();
  });

  async function handleSubmit() {
    if (!name.trim()) return;

    try {
      if (editId) {
        const res = await fetch(`/api/locations/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parent })
        });
        if (!res.ok) throw new Error("Gagal mengupdate data");
        editId = null;
      } else {
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parent })
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Gagal menyimpan data");
        }
      }

      name = "";
      parent = null;
      closeSheet();
      fetchLocations();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  function handleEdit(location: Location) {
    name = location.name;
    parent = location.parent;
    editId = location.id;
    showSheet = true;
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      fetchLocations();
    } catch (err) {
      console.error(err);
    }
  }

  function openAddSheet() {
    name = "";
    parent = null;
    editId = null;
    showSheet = true;
  }

  function closeSheet() {
    showSheet = false;
    name = "";
    parent = null;
    editId = null;
  }

  function getParentName(parentId: string | null): string {
    if (!parentId) return "None";
    const found = locations.find(l => l.id === parentId);
    return found ? found.name : "Unknown";
  }

  // Exclude current location from parent options (to prevent self-reference)
  function getParentOptions(currentId: string | null): Location[] {
    return locations.filter(l => l.id !== currentId);
  }
</script>

<svelte:head>
    <title>Locations</title>
</svelte:head>

<div class="locations-page">
    <header class="page-header">
        <h1 class="page-title">Locations</h1>
        <span class="location-count">{locations.length} total</span>
    </header>

    {#if loadError}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p class="empty-title">Failed to load</p>
            <p class="empty-subtitle">{loadError}</p>
            <button class="btn-retry" onclick={fetchLocations}>Try again</button>
        </div>
    {:else if locations.length === 0}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <p class="empty-title">No locations yet</p>
            <p class="empty-subtitle">Add your first location to get started</p>
        </div>
    {:else}
        <ul class="location-list" role="list">
            {#each locations as location (location.id)}
                <li class="location-card">
                    <button
                        class="location-content"
                        onclick={() => handleEdit(location)}
                        aria-label="Edit {location.name}"
                    >
                        <div class="location-info">
                            <span class="location-name">{location.name}</span>
                            {#if location.parent}
                                <span class="location-parent">Parent: {getParentName(location.parent)}</span>
                            {:else}
                                <span class="location-parent location-parent-none">No parent (root)</span>
                            {/if}
                        </div>
                        <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button
                        class="delete-btn"
                        onclick={() => handleDelete(location.id)}
                        aria-label="Delete {location.name}"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}

    <button class="fab" onclick={openAddSheet} aria-label="Add location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    </button>

    {#if showSheet}
        <div class="sheet-overlay" onclick={closeSheet}></div>
        <div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
            <div class="sheet-handle"></div>
            <h2 id="sheet-title" class="sheet-title">
                {editId ? 'Edit Location' : 'New Location'}
            </h2>

            <form class="location-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div class="form-group">
                    <label class="form-label" for="location-name">Location Name</label>
                    <input
                        id="location-name"
                        type="text"
                        class="form-input"
                        bind:value={name}
                        placeholder="e.g., Building A, Floor 1, Warehouse"
                        autocomplete="off"
                    />
                </div>

                <div class="form-group">
                    <label class="form-label" for="location-parent">Parent Location</label>
                    <select
                        id="location-parent"
                        class="form-select"
                        bind:value={parent}
                    >
                        <option value={null}>None (Root level)</option>
                        {#each getParentOptions(editId) as parentOption}
                            <option value={parentOption.id}>{parentOption.name}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick={closeSheet}>Cancel</button>
                    <button type="submit" class="btn-primary">
                        {editId ? 'Save Changes' : 'Add Location'}
                    </button>
                </div>
            </form>
        </div>
    {/if}
</div>

<style>
    .locations-page {
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

    .location-count {
        font-size: 13px;
        color: #78716c;
        margin-top: 2px;
        display: block;
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

    .location-list {
        list-style: none;
        padding: 8px;
        margin: 0;
    }

    .location-card {
        display: flex;
        align-items: stretch;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e7e5e4;
        overflow: hidden;
    }

    .location-content {
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

    .location-content:focus-visible {
        outline: 2px solid #f59e0b;
        outline-offset: -2px;
        border-radius: 8px;
    }

    .location-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .location-name {
        font-size: 16px;
        font-weight: 600;
        color: #1c1917;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .location-parent {
        font-size: 13px;
        color: #78716c;
    }

    .location-parent-none {
        color: #a8a29e;
        font-style: italic;
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

    .location-form {
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
