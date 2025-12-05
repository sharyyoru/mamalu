import { defineType, defineField } from "sanity";

export const contactInfo = defineType({
  name: "contactInfo",
  title: "Contact Information",
  type: "document",
  fields: [
    defineField({
      name: "pageTitle",
      title: "Page Title",
      type: "string",
    }),
    defineField({
      name: "pageSubtitle",
      title: "Page Subtitle",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "object",
      fields: [
        { name: "line1", title: "Address Line 1", type: "string" },
        { name: "line2", title: "Address Line 2", type: "string" },
        { name: "city", title: "City", type: "string" },
        { name: "country", title: "Country", type: "string" },
      ],
    }),
    defineField({
      name: "phone",
      title: "Phone Numbers",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string" },
            { name: "number", title: "Phone Number", type: "string" },
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "number",
            },
          },
        },
      ],
    }),
    defineField({
      name: "email",
      title: "Email Addresses",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string" },
            { name: "address", title: "Email Address", type: "string" },
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "address",
            },
          },
        },
      ],
    }),
    defineField({
      name: "hours",
      title: "Opening Hours",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "days", title: "Days", type: "string" },
            { name: "hours", title: "Hours", type: "string" },
          ],
          preview: {
            select: {
              title: "days",
              subtitle: "hours",
            },
          },
        },
      ],
    }),
    defineField({
      name: "mapEmbed",
      title: "Google Maps Embed URL",
      type: "url",
    }),
    defineField({
      name: "formRecipientEmail",
      title: "Contact Form Recipient Email",
      type: "string",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Contact Information" };
    },
  },
});
