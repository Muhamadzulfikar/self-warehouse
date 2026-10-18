<script lang="ts">
  import { onMount } from "svelte";
  import type { Todo } from "../../interface/todoInterface";

  let todos: Todo[] = $state([]);
  let title = $state("");
  let editId: string | null = $state(null);

  // State tambahan untuk kontrol UI Bottom Sheet & Error State
  let showSheet = $state(false);
  let loadError: string | null = $state(null);

  // READ: Ambil data dari API internal SvelteKit
  async function fetchTodos() {
    loadError = null;
    try {
      const res = await fetch("/api/todos");
      const result = await res.json();
      if (result.success) {
        todos = result.data;
      } else {
        loadError = result.error || "Gagal memuat data.";
      }
    } catch (err) {
      loadError = "Terjadi kesalahan jaringan.";
      console.error(err);
    }
  }

  onMount(() => {
    fetchTodos();
  });

  // CREATE / UPDATE
  async function handleSubmit() {
    if (!title.trim()) return;

    try {
      if (editId) {
        // UPDATE
        const res = await fetch(`/api/todos/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title })
        });
        if (!res.ok) throw new Error("Gagal mengupdate data");
        editId = null;
      } else {
        // CREATE (Mengirim JSON dengan properti title sesuai server kamu)
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title })
        });
        
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Gagal menyimpan data");
        }
      }

      title = "";
      closeSheet();
      fetchTodos();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  function handleEdit(todo: Todo) {
    title = todo.title;
    editId = todo.id;
    showSheet = true;
  }

  // DELETE
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  }

  // Helper untuk membuka & menutup Sheet
  function openAddSheet() {
    title = "";
    editId = null;
    showSheet = true;
  }

  function closeSheet() {
    showSheet = false;
    title = "";
    editId = null;
  }
</script>

<svelte:head>
    <title>Todos</title>
</svelte:head>

<div class="categories-page">
    <!-- Header -->
    <header class="page-header">
        <h1 class="page-title">Todos</h1>
        <span class="category-count">{todos.length} total</span>
    </header>

    <!-- Todo List / Empty State -->
    {#if loadError}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p class="empty-title">Failed to load</p>
            <p class="empty-subtitle">{loadError}</p>
            <button class="btn-retry" onclick={fetchTodos}>Try again</button>
        </div>
    {:else if todos.length === 0}
        <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.007zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p class="empty-title">No todos yet</p>
            <p class="empty-subtitle">Add your first task to get started</p>
        </div>
    {:else}
        <ul class="category-list" role="list">
            {#each todos as todo (todo.id)}
                <li class="category-card">
                    <button
                        class="category-content"
                        onclick={() => handleEdit(todo)}
                        aria-label="Edit {todo.title}"
                    >
                        <div class="category-info">
                            <span class="category-name">{todo.title}</span>
                        </div>
                        <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button
                        class="delete-btn"
                        onclick={() => handleDelete(todo.id)}
                        aria-label="Delete {todo.title}"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}

    <!-- Floating Add Button -->
    <button class="fab" onclick={openAddSheet} aria-label="Add todo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    </button>

    <!-- Bottom Sheet Overlay -->
    {#if showSheet}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="sheet-overlay" onclick={closeSheet}></div>
        <div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
            <div class="sheet-handle"></div>
            <h2 id="sheet-title" class="sheet-title">
                {editId ? 'Edit Todo' : 'New Todo'}
            </h2>

            <form class="category-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div class="form-group">
                    <label class="form-label" for="todo-title">Task Title</label>
                    <input
                        id="todo-title"
                        type="text"
                        class="form-input"
                        bind:value={title}
                        placeholder="e.g., Buy groceries, Finish report"
                        autocomplete="off"
                    />
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick={closeSheet}>Cancel</button>
                    <button type="submit" class="btn-primary">
                        {editId ? 'Save Changes' : 'Add Todo'}
                    </button>
                </div>
            </form>
        </div>
    {/if}
</div>

<style>
    /* Page Layout */
    .categories-page {
        min-height: 100dvh;
        background: #fafaf9;
        padding-bottom: 96px;
    }

    /* Header */
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

    .category-count {
        font-size: 13px;
        color: #78716c;
        margin-top: 2px;
        display: block;
    }

    /* Empty State */
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

    /* Category List */
    .category-list {
        list-style: none;
        padding: 8px;
        margin: 0;
    }

    .category-card {
        display: flex;
        align-items: stretch;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e7e5e4;
        overflow: hidden;
    }

    .category-content {
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

    .category-content:focus-visible {
        outline: 2px solid #f59e0b;
        outline-offset: -2px;
        border-radius: 8px;
    }

    .category-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .category-name {
        font-size: 16px;
        font-weight: 600;
        color: #1c1917;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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

    /* Floating Action Button */
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

    /* Bottom Sheet */
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

    /* Form */
    .category-form {
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

    .form-input {
        height: 48px;
        padding: 0 14px;
        font-size: 16px;
        border: 1.5px solid #d6d3d1;
        border-radius: 10px;
        background: #fff;
        color: #1c1917;
        transition: border-color 150ms, box-shadow 150ms;
    }

    .form-input::placeholder {
        color: #a8a29e;
    }

    .form-input:focus {
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