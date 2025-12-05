import { defineType, defineField } from "sanity";

export const recipe = defineType({
  name: "recipe",
  title: "Recipe",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "mainImage",
      title: "Main Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt Text",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "video",
      title: "Video URL",
      type: "url",
      description: "Optional video URL (YouTube, Vimeo)",
    }),
    defineField({
      name: "excerpt",
      title: "Short Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "recipeCategory" }] }],
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: [
          { title: "Easy", value: "easy" },
          { title: "Medium", value: "medium" },
          { title: "Hard", value: "hard" },
        ],
        layout: "radio",
      },
      initialValue: "medium",
    }),
    defineField({
      name: "cookingTime",
      title: "Cooking Time (minutes)",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "prepTime",
      title: "Prep Time (minutes)",
      type: "number",
    }),
    defineField({
      name: "servings",
      title: "Servings",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "ingredients",
      title: "Ingredients",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "item", title: "Ingredient", type: "string" },
            { name: "amount", title: "Amount", type: "string" },
            { name: "notes", title: "Notes", type: "string" },
          ],
          preview: {
            select: {
              title: "item",
              subtitle: "amount",
            },
          },
        },
      ],
    }),
    defineField({
      name: "instructions",
      title: "Instructions",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "step", title: "Step", type: "text", rows: 3 },
            { name: "image", title: "Step Image", type: "image" },
            { name: "tip", title: "Pro Tip", type: "string" },
          ],
          preview: {
            select: {
              title: "step",
            },
          },
        },
      ],
    }),
    defineField({
      name: "tips",
      title: "Chef's Tips",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Published Date, New",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      media: "mainImage",
      difficulty: "difficulty",
    },
    prepare(selection) {
      return {
        ...selection,
        subtitle: selection.difficulty,
      };
    },
  },
});
