-- Move press page data out of the page component and into editable site content.
INSERT INTO site_content (id, content)
VALUES (
  'press',
  '{
    "articles": [
      {
        "id": "1",
        "title": "Time out Dubai",
        "date": "December 2023",
        "description": "Featured by Time out Dubai - Dubai Bling filming locations: All the places to visit for certified bougie vibes",
        "url": "https://www.timeoutdubai.com/news/dubai-bling-locations",
        "image": "/images/press/press-01.png",
        "isActive": true,
        "sortOrder": 0
      },
      {
        "id": "2",
        "title": "What''s on",
        "date": "March 2023",
        "description": "Featured by What''s on Dubai - 6 delicious foodie workshops you need to try in Dubai.",
        "url": "https://whatson.ae/2023/03/food-workshops-and-cooking-classes-in-dubai/",
        "image": "/images/press/press-02.png",
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "3",
        "title": "Spinneys",
        "date": "March 2023",
        "description": "Women in food: Lama Jammal, founder, Mamalu Kitchen & Eazy Freezy",
        "url": "https://www.spinneys.com/en-ae/lifestyle/international-womens-day-lama-jammal-founder-mamalu-kitchen--eazy-freezy/",
        "image": "/images/press/press-6.jpg",
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": "4",
        "title": "Harper''s Bazaar Arabia",
        "date": "December 2023",
        "description": "Dubai Bling Season 2 Locations: 13 Places Spotted In The New Release",
        "url": "https://www.harpersbazaararabia.com/culture/entertainment/dubai-bling-season-2-locations",
        "image": "/images/press/press-03.png",
        "isActive": true,
        "sortOrder": 3
      },
      {
        "id": "5",
        "title": "Arabian Diaries",
        "date": "December 2023",
        "description": "Featured by Arabian Diaries Dubai - Culinary Excellence: Mamalu Kitchen Delights and Recipes",
        "url": "https://arabiandiaries.com/culinary-excellence-mamalu-kitchen-delights-and-recipes/",
        "image": "/images/press/press-04.png",
        "isActive": true,
        "sortOrder": 4
      },
      {
        "id": "6",
        "title": "Brand Collaboration for Puck on Shahid",
        "date": "May 2022",
        "description": "A Brand collaboration with Puck for Ramadan to do easy and delicious Iftar recipe",
        "url": null,
        "image": "/images/press/press-05.png",
        "isActive": true,
        "sortOrder": 5
      },
      {
        "id": "7",
        "title": "Meet The Founders",
        "date": "April 2022",
        "description": "An interview with Helen Farmer & Nakheel Mall to talk about Mamalu''s entrepreneurial journey.",
        "url": null,
        "image": "/images/press/press-7.jpg",
        "isActive": true,
        "sortOrder": 6
      },
      {
        "id": "8",
        "title": "Bosch",
        "date": "March 2022",
        "description": "Special mothers day class at the Bosch kitchen",
        "url": null,
        "image": "/images/press/press-8.jpg",
        "isActive": true,
        "sortOrder": 7
      },
      {
        "id": "9",
        "title": "Facebook",
        "date": "February 2022",
        "description": "A little about the world of Mamalu Kitchen and Eazy Freezy",
        "url": null,
        "image": "/images/press/press-9.jpg",
        "isActive": true,
        "sortOrder": 8
      },
      {
        "id": "10",
        "title": "Facebook",
        "date": "February 2022",
        "description": "Exclusive Japanese cuisine event held at Mamalu Kitchen",
        "url": null,
        "image": "/images/press/press-10.jpg",
        "isActive": true,
        "sortOrder": 9
      },
      {
        "id": "11",
        "title": "Al Arabiya",
        "date": "January 2022",
        "description": "Morning show with Al Arabiya for a healthy meal",
        "url": "https://www.youtube.com/watch?v=CTG9pX9EM84",
        "image": "/images/press/press-20.jpg",
        "isVideo": true,
        "isActive": true,
        "sortOrder": 10
      },
      {
        "id": "12",
        "title": "WhatsOn Dubai",
        "date": "December 2022",
        "description": "Featured by Whatson Dubai - fun Christmas presents to buy your friends and family. 6 best kitchen tools for cooking with kids this summer in UAE, for 2023",
        "url": null,
        "image": "/images/press/press-11.jpg",
        "isActive": true,
        "sortOrder": 11
      },
      {
        "id": "13",
        "title": "Expo 2020",
        "date": "December 2021",
        "description": "Women''s panel session at the EXPO2020 women''s pavilion",
        "url": null,
        "image": "/images/press/press-12.jpg",
        "isActive": true,
        "sortOrder": 12
      },
      {
        "id": "14",
        "title": "Timeout Dubai",
        "date": "June 2021",
        "description": "9 Creative things to try out this summer",
        "url": null,
        "image": "/images/press/press-13.jpg",
        "isActive": true,
        "sortOrder": 13
      },
      {
        "id": "15",
        "title": "Lovin'' Dubai",
        "date": "June 2021",
        "description": "6 Places to visit perfect for foodies",
        "url": null,
        "image": "/images/press/press-14.jpg",
        "isActive": true,
        "sortOrder": 14
      },
      {
        "id": "16",
        "title": "Fifi''s Birthday Celebration",
        "date": "March 2021",
        "description": "Featured in the Daily Mail UK, celebrating Fifi''s birthday at Mamalu Kitchen",
        "url": null,
        "image": "/images/press/press-15.jpg",
        "isActive": true,
        "sortOrder": 15
      },
      {
        "id": "17",
        "title": "Marie Claire Arabia",
        "date": "May 2021",
        "description": "Ramadan Special",
        "url": null,
        "image": "/images/press/press-16.png",
        "isActive": true,
        "sortOrder": 16
      },
      {
        "id": "18",
        "title": "What''s On Dubai",
        "date": "July 2020",
        "description": "Summer special for kids",
        "url": null,
        "image": "/images/press/press-17.png",
        "isActive": true,
        "sortOrder": 17
      },
      {
        "id": "19",
        "title": "What''s On Dubai",
        "date": "July 2020",
        "description": "Food hall of fame",
        "url": null,
        "image": "/images/press/press-18.png",
        "isActive": true,
        "sortOrder": 18
      },
      {
        "id": "20",
        "title": "The National",
        "date": "June 2020",
        "description": "Tips to keep children entertained indoors.",
        "url": null,
        "image": "/images/press/press-19.png",
        "isActive": true,
        "sortOrder": 19
      },
      {
        "id": "21",
        "title": "Elle Arabia",
        "date": "May 2020",
        "description": "Favorite dish to cook while in quarantine, using pantry staples. Staying home and staying healthy.",
        "url": null,
        "image": "/images/Mamalou Kitchen - 101.jpg",
        "isActive": true,
        "sortOrder": 20
      },
      {
        "id": "22",
        "title": "Depachika",
        "date": "March 2020",
        "description": "Mothers day gift ideas - bring some fun and ease to the kitchen by buying her some kitchen accessories to make kitchen prep a breeze.",
        "url": null,
        "image": "/images/Mamalou Kitchen - 102.jpg",
        "isActive": true,
        "sortOrder": 21
      },
      {
        "id": "23",
        "title": "Mojeh Magazine",
        "date": "March 2020",
        "description": "One of the entrepreneurs in Dubai dedicated to making people healthier and happier from the inside out.",
        "url": null,
        "image": "/images/Mamalou Kitchen - 103.jpg",
        "isActive": true,
        "sortOrder": 22
      },
      {
        "id": "24",
        "title": "What''s On Dubai",
        "date": "February 2020",
        "description": "Mamalu Kitchen was in the top 15 things to do in Dubai for the Valentines weekend.",
        "url": "https://whatson.ae/2020/02/15-great-things-to-do-in-dubai-this-weekend-10/",
        "image": "/images/Mamalou Kitchen - 104.jpg",
        "isActive": true,
        "sortOrder": 23
      },
      {
        "id": "25",
        "title": "The National Arts & Lifestyle",
        "date": "November 2019",
        "description": "Lama Jammal of Mamalu Kitchen wants to put healthy, home-cooked meals back on the table",
        "url": "https://www.mamalukitchen.com/_files/ugd/f73e67_40f3998fa9ff4b7b983b640cf1b7104a.pdf",
        "image": "/images/Mamalou Kitchen - 105.jpg",
        "isActive": true,
        "sortOrder": 24
      },
      {
        "id": "26",
        "title": "Harpers Bazaar",
        "date": "Summer 2018",
        "description": "Ever since I can remember I have always loved to cook",
        "url": "https://www.mamalukitchen.com/_files/ugd/f73e67_40f3998fa9ff4b7b983b640cf1b7104a.pdf",
        "image": "/images/Mamalou Kitchen - 110.jpg",
        "isActive": true,
        "sortOrder": 25
      },
      {
        "id": "27",
        "title": "My Fash Diary",
        "date": "November 2017",
        "description": "An Entrepreneurs story - Cooking classes for housekeepers",
        "url": null,
        "image": "/images/Mamalou Kitchen - 151.jpg",
        "isActive": true,
        "sortOrder": 26
      },
      {
        "id": "28",
        "title": "Harpers Bazaar Junior",
        "date": "April 2017",
        "description": "I wasn''t interested in dolls as a child, I preferred to play with toy kitchens",
        "url": null,
        "image": "/images/Mamalou Kitchen - 164.jpg",
        "isActive": true,
        "sortOrder": 27
      },
      {
        "id": "29",
        "title": "Sassy Mama",
        "date": "October 2017",
        "description": "Mamalu can make a cook out of you and your kids",
        "url": null,
        "image": "/images/Mamalou Kitchen - 165.jpg",
        "isActive": true,
        "sortOrder": 28
      },
      {
        "id": "30",
        "title": "Gourmet Magazine",
        "date": "January 2017",
        "description": "A recipe for success - If you want to dish up the dinner party of your dreams or simply serve up a family meal to be proud of",
        "url": null,
        "image": "/images/Mamalou Kitchen - 175.jpg",
        "isActive": true,
        "sortOrder": 29
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET content = EXCLUDED.content,
    updated_at = NOW();
