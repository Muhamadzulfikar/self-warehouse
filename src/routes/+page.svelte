<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Item } from '../interface/itemInterface';
	import type { Category } from '../interface/categoryInterface';
	import type { Location } from '../interface/locationInterface';

	const menuItems = [
		{
			name: 'Items',
			icon: '📦',
			route: '/items',
			color: '#2E7D32'
		},
		{
			name: 'Categories',
			icon: '🏷️',
			route: '/categories',
			color: '#1565C0'
		},
		{
			name: 'Locations',
			icon: '📍',
			route: '/locations',
			color: '#EF6C00'
		},
		{
			name: 'Movements',
			icon: '🔄',
			route: '/movements',
			color: '#7B1FA2'
		}
	];

	let items: Item[] = $state([]);
	let categories: Category[] = $state([]);
	let locations: Location[] = $state([]);

	// Build hierarchical location tree
	interface LocationNode {
		id: string;
		name: string;
		parent: string | null;
		children: LocationNode[];
		categoryTotals: Record<string, number>;
	}

	let locationTree = $derived.by(() => {
		const map = new Map<string, LocationNode>();
		const roots: LocationNode[] = [];

		// Initialize all locations as nodes
		for (const loc of locations) {
			map.set(loc.id, {
				id: loc.id,
				name: loc.name,
				parent: loc.parent,
				children: [],
				categoryTotals: {}
			});
		}

		// Build tree structure
		for (const node of map.values()) {
			if (node.parent && map.has(node.parent)) {
				map.get(node.parent)!.children.push(node);
			} else {
				roots.push(node);
			}
		}

		// Calculate category totals for each location (including sub-locations)
		for (const item of items) {
			// Find the location node and all its ancestors
			const locNode = map.get(item.location);
			if (locNode) {
				// Add to the direct location
				locNode.categoryTotals[item.category] = (locNode.categoryTotals[item.category] || 0) + item.quantity;

				// Add to all ancestor locations
				let current = locNode;
				while (current.parent && map.has(current.parent)) {
					const parent = map.get(current.parent)!;
					parent.categoryTotals[item.category] = (parent.categoryTotals[item.category] || 0) + item.quantity;
					current = parent;
				}
			}
		}

		return roots;
	});

	function getCategoryName(categoryId: string): string {
		const found = categories.find(c => c.id === categoryId);
		return found ? found.name : 'Unknown';
	}

	async function fetchData() {
		try {
			const [itemsRes, categoriesRes, locationsRes] = await Promise.all([
				fetch('/api/items'),
				fetch('/api/categories'),
				fetch('/api/locations')
			]);

			const [itemsResult, categoriesResult, locationsResult] = await Promise.all([
				itemsRes.json(),
				categoriesRes.json(),
				locationsRes.json()
			]);

			if (itemsResult.success) items = itemsResult.data;
			if (categoriesResult.success) categories = categoriesResult.data;
			if (locationsResult.success) locations = locationsResult.data;
		} catch (err) {
			console.error('Failed to fetch data:', err);
		}
	}

	fetchData();

	function navigateTo(route: string) {
		goto(route);
	}
</script>

<div class="container">
	<header class="header">
		<h1>Warehouse</h1>
		<p class="subtitle">Management System</p>
	</header>

	<div class="menu-grid">
		{#each menuItems as item}
			<button
				class="menu-card"
				onclick={() => navigateTo(item.route)}
				style="--card-color: {item.color}"
			>
				<div class="icon-wrapper">
					<span class="icon">{item.icon}</span>
				</div>
				<span class="label">{item.name}</span>
			</button>
		{/each}
	</div>

	{#if locations.length > 0}
		<div class="location-summary">
			<h2 class="summary-title">Stock by Location</h2>
			{#each locationTree as loc}
				{@render locationNode(loc, 0)}
			{/each}
		</div>
	{/if}
</div>

{#snippet locationNode(node: LocationNode, depth: number)}
	<div class="location-entry" style="padding-left: {depth * 16}px">
		<div class="location-header">
			<span class="location-name">{node.name}</span>
			{#if Object.keys(node.categoryTotals).length > 0}
				<span class="location-total">
					{Object.values(node.categoryTotals).reduce((a, b) => a + b, 0)} items
				</span>
			{/if}
		</div>
		<div class="category-list">
			{#each Object.entries(node.categoryTotals) as [catId, qty]}
				<div class="category-row">
					<span class="category-name">{getCategoryName(catId)}: {qty}</span>
				</div>
			{/each}
		</div>
	</div>
	{#each node.children as child}
		{@render locationNode(child, depth + 1)}
	{/each}
{/snippet}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f5f5;
		min-height: 100vh;
	}

	.container {
		max-width: 480px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.header {
		text-align: center;
		margin-bottom: 40px;
	}

	.header h1 {
		color: #1a1a2e;
		font-size: 32px;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.5px;
	}

	.subtitle {
		color: rgba(0, 0, 0, 0.5);
		font-size: 16px;
		margin: 8px 0 0 0;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.menu-card {
		background: #fff;
		border: none;
		border-radius: 20px;
		padding: 28px 16px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		transition: all 0.3s ease;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.menu-card:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		transform: translateY(-4px);
	}

	.menu-card:active {
		transform: translateY(0);
	}

	.icon-wrapper {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--card-color);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.icon {
		font-size: 32px;
	}

	.label {
		color: #1a1a2e;
		font-size: 16px;
		font-weight: 600;
	}

	.location-summary {
		margin-top: 32px;
		background: #fff;
		border-radius: 20px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.summary-title {
		font-size: 18px;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0 0 16px 0;
	}

	.location-entry {
		padding: 12px 0;
		border-bottom: 1px solid #e7e5e4;
	}

	.location-entry:last-child {
		border-bottom: none;
	}

	.location-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.location-name {
		font-size: 15px;
		font-weight: 600;
		color: #1a1a2e;
	}

	.location-total {
		font-size: 13px;
		color: #78716c;
		background: #f5f5f4;
		padding: 2px 8px;
		border-radius: 12px;
	}

	.category-list {
		margin-top: 8px;
		padding-left: 8px;
		border-left: 2px solid #e7e5e4;
	}

	.category-row {
		padding: 4px 0;
	}

	.category-name {
		font-size: 13px;
		color: #78716c;
	}
</style>
