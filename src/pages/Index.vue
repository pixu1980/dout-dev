<template>
  <Layout :show-logo="false">
    <!-- Author intro -->
    <Author :show-title="true" />

    <!-- List posts -->
    <div class="posts">
      <PostCard v-for="edge in $page.posts.edges" :key="edge.node.id" :post="edge.node" />
    </div>
    <Pager :info="$page.posts.pageInfo" />
  </Layout>
</template>

<page-query>
query ($page: Int) {
  posts: allPost(filter: { published: { eq: true }}, perPage: 5, page: $page) @paginate {
    pageInfo {
      totalPages
      currentPage
    }
    edges {
      node {
        id
        title
        date (format: "D. MMMM YYYY")
        timeToRead
        description
        cover_image (width: 770, height: 380, blur: 0)
        path
        tags {
          id
          title
          path
        }
      }
    }
  }
}
</page-query>

<script>
import { Pager } from "gridsome";
import Author from "~/components/Author.vue";
import PostCard from "~/components/PostCard.vue";

export default {
  components: {
    Author,
    PostCard,
    Pager,
  },
  metaInfo: {
    title: "Hello, world!",
  },
};
</script>
