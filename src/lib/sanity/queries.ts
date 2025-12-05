import { sanityClient } from "./client";

// ============ BLOG QUERIES ============
export async function getBlogs() {
  return sanityClient.fetch(`
    *[_type == "blog"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      publishedAt,
      featured,
      author->{name, image}
    }
  `);
}

export async function getBlogBySlug(slug: string) {
  return sanityClient.fetch(
    `
    *[_type == "blog" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      body,
      publishedAt,
      author->{name, image, bio}
    }
  `,
    { slug }
  );
}

// ============ RECIPE QUERIES ============
export async function getRecipes() {
  return sanityClient.fetch(`
    *[_type == "recipe"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      video,
      cookingTime,
      prepTime,
      servings,
      difficulty,
      featured,
      categories[]->{_id, title, slug}
    }
  `);
}

export async function getRecipeBySlug(slug: string) {
  return sanityClient.fetch(
    `
    *[_type == "recipe" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      video,
      ingredients,
      instructions,
      tips,
      cookingTime,
      prepTime,
      servings,
      difficulty,
      categories[]->{_id, title, slug}
    }
  `,
    { slug }
  );
}

export async function getRecipeCategories() {
  return sanityClient.fetch(`
    *[_type == "recipeCategory"] | order(title asc) {
      _id,
      title,
      slug,
      description,
      image
    }
  `);
}

// ============ PRODUCT QUERIES ============
export async function getProducts() {
  return sanityClient.fetch(`
    *[_type == "product"] | order(_createdAt desc) {
      _id,
      title,
      slug,
      description,
      price,
      compareAtPrice,
      images,
      categories[]->{_id, title, slug},
      tags,
      inStock,
      featured
    }
  `);
}

export async function getProductsByCategory(categorySlug: string) {
  return sanityClient.fetch(
    `
    *[_type == "product" && $categorySlug in categories[]->slug.current] | order(_createdAt desc) {
      _id,
      title,
      slug,
      description,
      price,
      compareAtPrice,
      images,
      categories[]->{_id, title, slug},
      inStock
    }
  `,
    { categorySlug }
  );
}

export async function getProductBySlug(slug: string) {
  return sanityClient.fetch(
    `
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      price,
      compareAtPrice,
      images,
      video,
      body,
      categories[]->{_id, title, slug},
      tags,
      inStock,
      sku,
      weight
    }
  `,
    { slug }
  );
}

export async function getProductCategories() {
  return sanityClient.fetch(`
    *[_type == "productCategory"] | order(order asc, title asc) {
      _id,
      title,
      slug,
      description,
      image
    }
  `);
}

// ============ CLASS QUERIES ============
export async function getClasses() {
  return sanityClient.fetch(`
    *[_type == "cookingClass" && active == true] | order(startDate asc) {
      _id,
      title,
      slug,
      description,
      mainImage,
      classType,
      numberOfSessions,
      sessionDuration,
      pricePerSession,
      fullPrice,
      startDate,
      spotsAvailable,
      maxSpots,
      location,
      featured,
      instructor->{name, image, title}
    }
  `);
}

export async function getClassBySlug(slug: string) {
  return sanityClient.fetch(
    `
    *[_type == "cookingClass" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      mainImage,
      body,
      classType,
      numberOfSessions,
      sessionDuration,
      pricePerSession,
      fullPrice,
      startDate,
      schedule,
      whatYouLearn,
      requirements,
      spotsAvailable,
      maxSpots,
      location,
      instructor->{name, image, title, bio, specialties, experience}
    }
  `,
    { slug }
  );
}

// ============ PRESS QUERIES ============
export async function getPressArticles() {
  return sanityClient.fetch(`
    *[_type == "press"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      source,
      externalUrl,
      publishedAt,
      featured
    }
  `);
}

export async function getPressArticleBySlug(slug: string) {
  return sanityClient.fetch(
    `
    *[_type == "press" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      body,
      source,
      externalUrl,
      publishedAt
    }
  `,
    { slug }
  );
}

// ============ PAGE QUERIES ============
export async function getHomePage() {
  return sanityClient.fetch(`
    *[_type == "homePage"][0] {
      heroTitle,
      heroHighlight,
      heroSubtitle,
      heroImage,
      heroCta,
      featuresTitle,
      featuresSubtitle,
      features,
      stats,
      ctaTitle,
      ctaSubtitle,
      ctaButtons
    }
  `);
}

export async function getAboutPage() {
  return sanityClient.fetch(`
    *[_type == "aboutPage"][0] {
      title,
      subtitle,
      heroImage,
      storyTitle,
      storyContent,
      storyImage,
      valuesTitle,
      values,
      team,
      seoDescription
    }
  `);
}

export async function getContactInfo() {
  return sanityClient.fetch(`
    *[_type == "contactInfo"][0] {
      pageTitle,
      pageSubtitle,
      address,
      phone,
      email,
      hours,
      mapEmbed
    }
  `);
}

export async function getSiteSettings() {
  return sanityClient.fetch(`
    *[_type == "siteSettings"][0] {
      siteName,
      siteTagline,
      logo,
      seoDescription,
      seoKeywords,
      socialLinks,
      announcementBar
    }
  `);
}
