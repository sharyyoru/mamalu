import { defineType, defineField } from "sanity";
import { InstructorInput } from "../components/InstructorInput";

export const cookingClass = defineType({
  name: "cookingClass",
  title: "Cooking Class",
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
      name: "description",
      title: "Short Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Full Description",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    }),
    defineField({
      name: "classType",
      title: "Class Format",
      type: "string",
      options: {
        list: [
          { title: "In-Person", value: "in-person" },
          { title: "Online", value: "online" },
          { title: "Private", value: "private" },
          { title: "Corporate", value: "corporate" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "The target audience category for this class",
      options: {
        list: [
          { title: "Kids Classes", value: "kids" },
          { title: "Family Classes", value: "family" },
          { title: "Birthday Parties", value: "birthday" },
          { title: "Adult Classes", value: "adults" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "instructorId",
      title: "Instructor",
      type: "string",
      description: "Select an instructor from your database (Admin → Users with instructor role)",
      components: {
        input: InstructorInput,
      },
    }),
    defineField({
      name: "numberOfSessions",
      title: "Number of Sessions",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "sessionDuration",
      title: "Session Duration (hours)",
      type: "number",
    }),
    defineField({
      name: "pricePerSession",
      title: "Price per Session (AED)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "fullPrice",
      title: "Full Course Price (AED)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "datetime",
    }),
    defineField({
      name: "schedule",
      title: "Schedule",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "sessionNumber", title: "Session #", type: "number" },
            { name: "title", title: "Session Title", type: "string" },
            { name: "description", title: "What You'll Learn", type: "text" },
            { name: "date", title: "Date", type: "datetime" },
          ],
          preview: {
            select: {
              title: "title",
              sessionNumber: "sessionNumber",
            },
            prepare(selection) {
              return {
                title: `Session ${selection.sessionNumber}: ${selection.title}`,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "whatYouLearn",
      title: "What You'll Learn",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "requirements",
      title: "Requirements",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "spotsAvailable",
      title: "Spots Available",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "maxSpots",
      title: "Maximum Spots",
      type: "number",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: "Physical location or 'Online'",
    }),
    defineField({
      name: "featured",
      title: "Featured Class",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "active",
      title: "Active (Accepting Bookings)",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Start Date",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      classType: "classType",
      media: "mainImage",
      spots: "spotsAvailable",
    },
    prepare(selection) {
      const { title, classType, spots } = selection;
      return {
        ...selection,
        title,
        subtitle: `${classType} - ${spots} spots left`,
      };
    },
  },
});
