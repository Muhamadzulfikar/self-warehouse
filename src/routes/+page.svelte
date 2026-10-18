<script>
	import { goto } from '$app/navigation';

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

	function navigateTo(route) {
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
</div>

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
</style>
