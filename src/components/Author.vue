<template>
  <div class="author">
    <g-image
      alt="Author image"
      class="author__image"
      src="~/assets/images/portrait.png"
      width="250"
      height="250"
      blur="5"
    />

    <h1 v-if="showTitle" class="author__site-title">
      {{ $static.metadata.siteName }}
    </h1>

    <p class="author__intro">
      {{ $static.metadata.siteDescription }}
    </p>

    <p class="author__links">
      <a href="//twitter.com/gridsome">Follow on Twitter</a>
      <a href="//github.com/gridsome/gridsome-starter-blog">GitHub</a>
    </p>
  </div>
</template>

<static-query>
query {
  metadata {
    siteName
		siteDescription
  }
}
</static-query>

<script>
export default {
  props: ["showTitle"],
};
</script>

<style lang="scss">
.author {
  margin: 0 auto;
  max-width: 50rem;
  text-align: center;
  padding: calc(var(--space) / 2) 0;

  &__image {
    border-radius: 100%;
    width: 18rem;
    height: 18rem;
    margin-bottom: 1rem;
  }

  &__intro {
    opacity: 0.8;
    font-size: 1.7rem;
  }

  &__site-title {
    font-size: 2.5rem;
  }

  &__links {
    margin-top: -0.5rem;
    a {
      margin: 0 0.5rem;
    }
  }
}
</style>
