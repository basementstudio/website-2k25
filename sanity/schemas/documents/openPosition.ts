import { defineField, defineType } from "sanity"

export const openPosition = defineType({
  name: "openPosition",
  title: "Open Position",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string"
    }),
    defineField({
      name: "employmentType",
      title: "Employment Type",
      type: "string"
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string"
    }),
    defineField({
      name: "isOpen",
      title: "Is Open",
      type: "boolean",
      initialValue: true
    }),
    defineField({
      name: "applyUrl",
      title: "Apply URL",
      type: "url"
    }),
    defineField({
      name: "jobDescription",
      title: "Job Description",
      type: "array",
      of: [{ type: "block" }]
    }),
    defineField({
      name: "applyFormSetup",
      title: "Apply Form Setup",
      type: "object",
      fields: [
        defineField({
          name: "formFields",
          title: "Form Fields",
          type: "array",
          of: [{ type: "string" }],
          options: {
            list: [
              "First and last name",
              "Email",
              "Where are you based",
              "Why do you want to join",
              "Years of experience",
              "Skills",
              "Portfolio",
              "Github",
              "Availability to start",
              "Availability to work",
              "Linkedin",
              "Salary Expectation"
            ]
          }
        }),
        defineField({
          name: "skills",
          title: "Skills",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string"
                }),
                defineField({
                  name: "slug",
                  title: "Slug",
                  type: "string"
                })
              ]
            }
          ]
        })
      ]
    })
  ]
})
