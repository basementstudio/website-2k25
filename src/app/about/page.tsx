import { Pump } from "basehub/react-pump";
import { RichText } from "basehub/react-rich-text";
import Image from "next/image";
import Link from "next/link";

const About = () => (
  <Pump
    queries={[
      {
        pages: {
          about: {
            intro: {
              json: { content: true },
            },
            imageSequence: {
              items: {
                image: {
                  url: true,
                  width: true,
                  height: true,
                },
              },
            },
          },
        },
        company: {
          services: {
            serviceList: {
              items: {
                _title: true,
                category: {
                  _title: true,
                },
              },
            },
          },
          clients: {
            clientList: {
              items: {
                _title: true,
                website: true,
              },
            },
          },
          people: {
            peopleList: {
              items: {
                _title: true,
                department: {
                  _title: true,
                },
                role: true,
              },
            },
          },
          awards: {
            awardList: {
              items: {
                _id: true,
                title: true,
                date: true,
                project: {
                  _title: true,
                },
              },
            },
          },
        },
      },
    ]}
    next={{ revalidate: 30 }}
  >
    {async ([data]) => {
      "use server";
      if (!data) return null;

      const servicesByCategory = data.company.services.serviceList.items.reduce(
        (acc, service) => {
          const category = service.category._title;
          if (!acc[category]) acc[category] = [];

          acc[category].push(service._title);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      const groupedClients = data.company.clients.clientList.items
        .sort((a, b) => a._title.localeCompare(b._title))
        .reduce(
          (acc, client, index) => {
            const groupIndex = Math.floor(
              index /
                Math.ceil(data.company.clients.clientList.items.length / 5),
            );
            if (!acc[groupIndex]) acc[groupIndex] = [];
            acc[groupIndex].push(client);
            return acc;
          },
          {} as Record<number, typeof data.company.clients.clientList.items>,
        );

      const groupedPeople = data.company.people.peopleList.items.reduce(
        (acc, person) => {
          const department = person.department._title;
          if (!acc[department]) acc[department] = [];
          acc[department].push(person);
          return acc;
        },
        {} as Record<string, typeof data.company.people.peopleList.items>,
      );

      return (
        <main className="relative -mt-24 w-full bg-brand-k pt-2">
          <section className="grid-layout pb-45">
            <h1 className="col-start-1 col-end-5 text-heading uppercase text-brand-w2">
              About Us
            </h1>
            <Image
              src={data.pages.about.imageSequence.items[0].image.url}
              width={data.pages.about.imageSequence.items[0].image.width}
              height={data.pages.about.imageSequence.items[0].image.height}
              alt=""
              className="col-start-5 col-end-7"
            />
            <div className="col-start-9 col-end-12 text-paragraph text-brand-w2">
              <RichText content={data.pages.about.intro.json.content} />
            </div>
          </section>

          <div className="grid-layout pb-45">
            <div className="relative col-start-1 col-end-13 grid grid-cols-6 gap-2">
              <hr className="absolute top-5 w-full border-brand-w1/20" />
              {Object.entries(servicesByCategory).map(
                ([category, services]) => (
                  <div
                    key={category}
                    className="col-span-1 flex flex-col gap-5"
                  >
                    <h2 className="text-paragraph text-brand-g1">{category}</h2>
                    <ul>
                      {services.map((service) => (
                        <li
                          key={service}
                          className="text-subheading text-brand-w2"
                        >
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="grid-layout pb-45">
            <h2 className="col-start-1 col-end-5 text-heading uppercase text-brand-w2">
              Clients
            </h2>
            <div className="col-start-5 col-end-10 grid grid-cols-5 gap-2">
              {Object.entries(groupedClients).map(([groupIndex, clients]) => (
                <div key={groupIndex} className="col-span-1">
                  <ul>
                    {clients.sort().map((client) => (
                      <li
                        className="actionable text-paragraph leading-5 text-brand-w1"
                        key={client._title}
                      >
                        {client._title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-layout pb-45">
            <div className="col-start-1 col-end-5 flex flex-col gap-6">
              {Object.entries(groupedPeople).map(
                ([department, people], index) => (
                  <div key={department}>
                    <div className="grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-2">
                      {index === 0 && (
                        <p className="text-paragraph text-brand-g1">A-Z</p>
                      )}
                      <p className="col-start-2 text-paragraph text-brand-g1">
                        {department}
                      </p>
                    </div>

                    <ul className="text-paragraph text-brand-w1">
                      {people.map((person) => (
                        <li
                          key={person._title}
                          className="group relative grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-0.5 pt-px"
                        >
                          <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="col-span-1">{person._title}</div>
                          <div className="col-span-1">{person.role}</div>
                          <div className="col-span-2">
                            <a className="actionable text-w2">LinkedIn</a> /{" "}
                            <a className="actionable text-w2">Email</a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
            <div className="col-start-5 col-end-13 grid h-fit grid-cols-8 gap-2 pt-5">
              {data.company.people.peopleList.items.map((person) => (
                <div
                  key={person._title}
                  className="with-dots aspect-[136/156] border border-brand-w1/20 text-brand-w1/20"
                >
                  <svg
                    stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 134 156"
                  >
                    <path d="M0-.00024414 134 156" />
                  </svg>
                </div>
              ))}
              <div className="with-diagonal-lines relative col-span-7 flex items-center justify-center">
                <Link href="/">
                  <span className="actionable bg-brand-k text-paragraph text-brand-w1">
                    Apply Here →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid-layout">
            <h2 className="relative z-20 col-start-1 col-end-3 row-start-1 text-heading uppercase text-brand-w2">
              Awards
            </h2>
            <p className="relative z-20 col-start-3 col-end-4 row-start-1 text-heading uppercase text-brand-g2">
              x25
            </p>
            <ul className="relative col-start-1 col-end-13 row-start-1 text-paragraph text-brand-w1">
              {data.company.awards.awardList.items.map((award) => (
                <li
                  key={award._id}
                  className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:border-t"
                >
                  <div className="item col-start-5 col-end-13 grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-0.5 pt-px">
                    <div className="col-span-1">{award.title}</div>
                    <div className="col-span-1">{award.project._title}</div>
                    <div className="col-span-1">
                      {new Date(award.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </li>
              ))}
            </ul>
          </div>
        </main>
      );
    }}
  </Pump>
);

export default About;
