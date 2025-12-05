import { defineType, defineField } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "heroTitle",
      title: "Hero Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "heroHighlight",
      title: "Hero Highlight Text",
      type: "string",
      description: "The colored/highlighted word in the title",
    }),
    defineField({
      name: "heroSubtitle",
      title: "Hero Subtitle",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hero Background Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroCta",
      title: "Hero Call to Action",
      type: "object",
      fields: [
        { name: "primaryText", title: "Primary Button Text", type: "string" },
        { name: "primaryLink", title: "Primary Button Link", type: "string" },
        { name: "secondaryText", title: "Secondary Button Text", type: "string" },
        { name: "secondaryLink", title: "Secondary Button Link", type: "string" },
      ],
    }),
    defineField({
      name: "featuresTitle",
      title: "Features Section Title",
      type: "string",
    }),
    defineField({
      name: "featuresSubtitle",
      title: "Features Section Subtitle",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "icon", title: "Icon Name", type: "string", description: "e.g., UtensilsCrossed, ShoppingBag, BookOpen, Users" },
            { name: "title", title: "Title", type: "string" },
            { name: "description", title: "Description", type: "text", rows: 2 },
            { name: "link", title: "Link", type: "string" },
          ],
          preview: {
            select: { title: "title" },
          },
        },
      ],
    }),
    defineField({
      name: "stats",
      title: "Statistics",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", title: "Value", type: "string" },
            { name: "label", title: "Label", type: "string" },
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "value",
            },
          },
        },
      ],
    }),
    defineField({
      name: "ctaTitle",
      title: "CTA Section Title",
      type: "string",
    }),
    defineField({
      name: "ctaSubtitle",
      title: "CTA Section Subtitle",
      type: "string",
    }),
    defineField({
      name: "ctaButtons",
      title: "CTA Buttons",
      type: "object",
      fields: [
        { name: "primaryText", title: "Primary Button Text", type: "string" },
        { name: "primaryLink", title: "Primary Button Link", type: "string" },
        { name: "secondaryText", title: "Secondary Button Text", type: "string" },
        { name: "secondaryLink", title: "Secondary Button Link", type: "string" },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Home Page" };
    },
  },
});
