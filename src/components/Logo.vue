<template>
	<g-link class="logo" to="/">
	  <span class="logo__text">
	    &larr; {{ $static.metadata.siteName }}
	  </span>
	</g-link>
</template>

<static-query>
query {
  metadata {
    siteName
  }
}
</static-query>

<style lang="scss">
.logo {
	text-decoration: none;
  color: var(--body-color)!important;
  font-size: .9rem;

	&__image {
		vertical-align: middle;
		border-radius: 10rem;
		height: 4rem;
		width: 4rem;
		margin-right: .5rem;
	}
}
</style>
