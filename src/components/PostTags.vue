<template>
   <div class="post-tags">
   		<g-link class="post-tags__link" v-for="tag in post.tags" :key="tag.id" :to="tag.path">
   			<span>#</span> {{ tag.title }}
   		</g-link>
    </div>
</template>

<script>
export default {
  props: ['post']
}
</script>

<style lang="scss">
.post-tags {
  margin: 1rem 0 0;

  &__link {
  	margin-right: .7rem;
  	font-size: .8rem;
  	color: currentColor;
  	text-decoration: none;
  	background-color: var(--bg-color);
  	color: currentColor!important; //Todo: remove important;
  	padding: .5rem;
  	border-radius: var(--radius);
  }
}
</style>
