/* Generated from trip-data.json by npm run build:data. */
window.TRAVEL_PLAN_DATA_BUNDLE = {
  "$schema": "./schemas/trip-data.schema.json",
  "schemaVersion": "2.0-lite",
  "config": {
    "schemaVersion": "1.0.0",
    "modules": {
      "flights": true,
      "overview": true,
      "itinerary": true,
      "todo": true,
      "driving": true,
      "ledger": true
    },
    "language": "en",
    "persistence": {
      "mode": "d1",
      "apiBase": "/api/trip",
      "sharedCollections": [
        "todos",
        "tickets",
        "ledger"
      ]
    }
  },
  "metadata": {
    "tripId": "japan-kanto-chubu-2026-2027",
    "title": "Japan · Kanto & Chubu 2026–27",
    "language": "en",
    "assets": {
      "routeMaps": [
        "assets/maps/kanto-chubu-relief-clean.png"
      ]
    }
  },
  "trip": {
    "status": "draft",
    "startDate": "2026-12-17",
    "endDate": "2027-01-02",
    "dayCount": 17,
    "nightCountAway": 16,
    "countries": [
      {
        "code": "JP",
        "name": "Japan",
        "nameEn": "Japan"
      }
    ],
    "primaryDestinationCountries": [
      "JP"
    ],
    "citiesAndAreas": [
      "Tokyo",
      "Minakami",
      "Tonami, Toyama",
      "Nagoya",
      "Matsushiro, Nagano",
      "Hakone",
      "Kawagoe"
    ],
    "routeSummary": "Tokyo → Minakami → Tonami, Toyama → Nagoya → Matsushiro, Nagano → Hakone → Kawagoe → Tokyo Haneda Airport",
    "groupSize": 2,
    "heroTitle": "Kanto & Chubu Trip",
    "heroEyebrow": "Japan"
  },
  "flightJourneys": [
    {
      "id": "journey-outbound",
      "title": "Singapore to Tokyo",
      "status": "confirmed",
      "bookingReference": "DIU7WC"
    },
    {
      "id": "journey-return",
      "title": "Tokyo to Singapore",
      "status": "confirmed",
      "bookingReference": "DIU7WC"
    }
  ],
  "flights": [
    {
      "id": "flight-sq632",
      "journeyId": "journey-outbound",
      "sequence": 1,
      "airline": {
        "name": "Singapore Airlines"
      },
      "flightNumber": "SQ 632",
      "aircraft": "Airbus A350-900",
      "departure": {
        "airportCode": "SIN",
        "city": "Singapore",
        "date": "2026-12-17",
        "time": "08:05",
        "utcOffset": "+08:00",
        "terminal": "Terminal 2"
      },
      "arrival": {
        "airportCode": "HND",
        "city": "Tokyo",
        "date": "2026-12-17",
        "time": "15:35",
        "utcOffset": "+09:00",
        "terminal": "Terminal 3"
      },
      "status": "confirmed"
    },
    {
      "id": "flight-sq633",
      "journeyId": "journey-return",
      "sequence": 1,
      "airline": {
        "name": "Singapore Airlines"
      },
      "flightNumber": "SQ 633",
      "aircraft": "Airbus A350-900",
      "departure": {
        "airportCode": "HND",
        "city": "Tokyo",
        "date": "2027-01-02",
        "time": "16:40",
        "utcOffset": "+09:00",
        "terminal": "Terminal 3"
      },
      "arrival": {
        "airportCode": "SIN",
        "city": "Singapore",
        "date": "2027-01-02",
        "time": "23:25",
        "utcOffset": "+08:00",
        "terminal": "Assigned approximately 2 hours before arrival"
      },
      "status": "confirmed"
    }
  ],
  "accommodations": [
    {
      "id": "stay-tokyo",
      "name": "TBD",
      "cityOrArea": "Tokyo",
      "checkInDate": "2026-12-17",
      "checkOutDate": "2026-12-20",
      "status": "pending",
      "note": "Tokyo accommodation details have not been provided."
    },
    {
      "id": "stay-minakami",
      "name": "Bettei Senjuan",
      "cityOrArea": "Minakami, Gunma",
      "checkInDate": "2026-12-20",
      "checkInTime": "13:00",
      "checkOutDate": "2026-12-22",
      "checkOutTime": "11:00",
      "roomType": "Japanese-Western room with private open-air bath",
      "bookingReference": "Yoyaku001997",
      "status": "confirmed",
      "address": "614 Tanigawa, Minakami, Tone-gun, Gunma 379-1619, Japan",
      "cost": {
        "currency": "JPY",
        "amount": 246600
      }
    },
    {
      "id": "stay-toyama",
      "name": "Mercure Toyama Tonami Resort & Spa",
      "cityOrArea": "Tonami, Toyama",
      "checkInDate": "2026-12-22",
      "checkInTime": "15:00",
      "checkOutDate": "2026-12-25",
      "checkOutTime": "11:00",
      "roomType": "Classic Room with 2 single beds and 1 sofa bed",
      "bookingReference": "QQMPBJFW",
      "status": "confirmed",
      "cost": {
        "currency": "JPY",
        "amount": 21600
      }
    },
    {
      "id": "stay-nagoya",
      "name": "ibis Styles Nagoya",
      "cityOrArea": "Nagoya",
      "checkInDate": "2026-12-25",
      "checkInTime": "14:00",
      "checkOutDate": "2026-12-27",
      "checkOutTime": "11:00",
      "roomType": "Standard Room with 1 double bed, non-smoking",
      "bookingReference": "QQMHBFJF",
      "status": "confirmed",
      "cost": {
        "currency": "JPY",
        "amount": 16150
      }
    },
    {
      "id": "stay-nagano",
      "name": "Mercure Nagano Matsushiro Resort & Spa",
      "cityOrArea": "Matsushiro, Nagano",
      "checkInDate": "2026-12-27",
      "checkInTime": "15:00",
      "checkOutDate": "2026-12-29",
      "checkOutTime": "11:00",
      "roomType": "Classic Room with 2 single beds and 1 sofa bed, mountain view",
      "bookingReference": "QQMPBKNC",
      "status": "confirmed",
      "cost": {
        "currency": "JPY",
        "amount": 26733
      },
      "costNote": "Cash amount after 4,000 reward points; booking value JPY 41,230."
    },
    {
      "id": "stay-hakone",
      "name": "Hakone Hotel",
      "cityOrArea": "Hakone, Kanagawa",
      "checkInDate": "2026-12-29",
      "checkInTime": "15:00",
      "checkOutDate": "2026-12-31",
      "checkOutTime": "11:00",
      "roomType": "Moderate Twin Room, non-smoking",
      "bookingReference": "73538484924607",
      "status": "confirmed",
      "cost": {
        "currency": "SGD",
        "amount": 848.81
      },
      "costNote": "Includes SGD 4.86 due at the property."
    },
    {
      "id": "stay-kawagoe",
      "name": "Kawagoe Tobu Hotel",
      "cityOrArea": "Kawagoe, Saitama",
      "checkInDate": "2026-12-31",
      "checkInTime": "14:00",
      "checkOutDate": "2027-01-02",
      "checkOutTime": "11:00",
      "roomType": "Twin Room",
      "bookingReference": "73538489022614",
      "status": "confirmed",
      "cost": {
        "currency": "SGD",
        "amount": 560.99
      }
    }
  ],
  "groundTransport": {
    "rentalCar": {
      "company": "Nissan Rent a Car",
      "reservationNumber": "26090603811",
      "rentalPeriodDays": 13,
      "vehicle": {
        "example": "Nissan Kicks e-POWER",
        "class": "RH0"
      },
      "unlimitedKilometers": false,
      "price": {
        "currency": "JPY",
        "payAtCounter": 198484
      },
      "insurance": [
        "Insurance plan included",
        "Studless snow tyres reserved",
        "ETC card reserved"
      ],
      "pickup": {
        "date": "2026-12-20",
        "time": "09:00",
        "location": "Nissan Rent a Car · Haneda Airport",
        "address": "5-3-1 Haneda, Ota-ku, Tokyo",
        "utcOffset": "+09:00"
      },
      "dropoff": {
        "date": "2027-01-02",
        "time": "13:00",
        "timeZoneLabel": "Japan Standard Time",
        "vehicleReturnPoint": "Nissan Rent a Car · Haneda Airport",
        "deadlineWarning": "Return the vehicle no later than 13:00.",
        "recommendedArrivalTime": "13:00",
        "utcOffset": "+09:00"
      }
    },
    "rentalChecklist": [
      "Complete online check-in before pickup where possible.",
      "Bring the original valid driving licence and required permit.",
      "Confirm the studless snow tyres and ETC card at pickup.",
      "Inspect the vehicle and record existing damage before departure."
    ],
    "drivingNotes": [
      "Self-drive begins on 20 December 2026 and continues through the end of the trip.",
      "The reservation includes studless snow tyres and one ETC card; 4WD was not requested.",
      "Car navigation and an ETC onboard unit are standard equipment."
    ],
    "drivingReferenceLinks": [
      {
        "label": "Nissan reservation inquiry",
        "url": "https://nissan-rentacar.com/en/reservation-inquiry/?reservation_number=26090603811"
      }
    ],
    "plannedRoadLegs": [
      {
        "date": "2026-12-20",
        "from": "Tokyo",
        "to": "Minakami"
      },
      {
        "date": "2026-12-22",
        "from": "Minakami",
        "to": "Tonami, Toyama"
      },
      {
        "date": "2026-12-25",
        "from": "Tonami, Toyama",
        "to": "Nagoya"
      },
      {
        "date": "2026-12-27",
        "from": "Nagoya",
        "to": "Matsushiro, Nagano"
      },
      {
        "date": "2026-12-29",
        "from": "Matsushiro, Nagano",
        "to": "Hakone"
      },
      {
        "date": "2026-12-31",
        "from": "Hakone",
        "to": "Kawagoe"
      },
      {
        "date": "2027-01-02",
        "from": "Kawagoe",
        "to": "Tokyo Haneda Airport"
      }
    ],
    "publicTransitAndRail": [
      {
        "startDate": "2026-12-17",
        "endDate": "2026-12-19",
        "area": "Tokyo",
        "mode": "Public Transport"
      }
    ]
  },
  "days": [
    {
      "day": 1,
      "date": "2026-12-17",
      "title": "Arrival in Tokyo",
      "locations": [
        "Singapore",
        "Tokyo"
      ],
      "schedule": [
        {
          "id": "day-01-event-1",
          "time": "08:05",
          "type": "flight",
          "text": "SQ 632 departs Singapore Changi Airport for Tokyo Haneda Airport."
        },
        {
          "id": "day-01-event-2",
          "time": "15:35",
          "type": "flight",
          "text": "Arrive at Tokyo Haneda Airport."
        },
        {
          "id": "day-01-event-3",
          "time": "TBD",
          "type": "transfer",
          "text": "Public transport to Tokyo accommodation · TBD."
        },
        {
          "id": "day-01-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 2,
      "date": "2026-12-18",
      "title": "Tokyo",
      "locations": [
        "Tokyo"
      ],
      "schedule": [
        {
          "id": "day-02-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 3,
      "date": "2026-12-19",
      "title": "Tokyo",
      "locations": [
        "Tokyo"
      ],
      "schedule": [
        {
          "id": "day-03-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 4,
      "date": "2026-12-20",
      "title": "Tokyo to Minakami",
      "locations": [
        "Tokyo",
        "Minakami"
      ],
      "schedule": [
        {
          "id": "day-04-event-1",
          "time": "09:00",
          "type": "rental-car",
          "text": "Pick up the rental car at Nissan Rent a Car, Haneda Airport.",
          "placeId": "place-haneda"
        },
        {
          "id": "day-04-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Tokyo Haneda Airport to Minakami.",
          "placeIds": [
            "place-haneda",
            "place-minakami"
          ]
        },
        {
          "id": "day-04-event-3",
          "time": "13:00",
          "type": "check-in",
          "text": "Check in at Bettei Senjuan.",
          "placeId": "place-minakami"
        },
        {
          "id": "day-04-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 5,
      "date": "2026-12-21",
      "title": "Minakami",
      "locations": [
        "Minakami"
      ],
      "schedule": [
        {
          "id": "day-05-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 6,
      "date": "2026-12-22",
      "title": "Minakami to Tonami, Toyama",
      "locations": [
        "Minakami",
        "Tonami, Toyama"
      ],
      "schedule": [
        {
          "id": "day-06-event-1",
          "time": "11:00",
          "type": "check-out",
          "text": "Check out from Bettei Senjuan.",
          "placeId": "place-minakami"
        },
        {
          "id": "day-06-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Minakami to Tonami, Toyama.",
          "placeIds": [
            "place-minakami",
            "place-tonami"
          ]
        },
        {
          "id": "day-06-event-3",
          "time": "15:00",
          "type": "check-in",
          "text": "Check in at Mercure Toyama Tonami Resort & Spa.",
          "placeId": "place-tonami"
        },
        {
          "id": "day-06-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 7,
      "date": "2026-12-23",
      "title": "Tonami, Toyama",
      "locations": [
        "Tonami, Toyama"
      ],
      "schedule": [
        {
          "id": "day-07-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 8,
      "date": "2026-12-24",
      "title": "Tonami, Toyama",
      "locations": [
        "Tonami, Toyama"
      ],
      "schedule": [
        {
          "id": "day-08-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 9,
      "date": "2026-12-25",
      "title": "Tonami, Toyama to Nagoya",
      "locations": [
        "Tonami, Toyama",
        "Nagoya"
      ],
      "schedule": [
        {
          "id": "day-09-event-1",
          "time": "11:00",
          "type": "check-out",
          "text": "Check out from Mercure Toyama Tonami Resort & Spa.",
          "placeId": "place-tonami"
        },
        {
          "id": "day-09-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Tonami, Toyama to Nagoya.",
          "placeIds": [
            "place-tonami",
            "place-nagoya"
          ]
        },
        {
          "id": "day-09-event-3",
          "time": "14:00",
          "type": "check-in",
          "text": "Check in at ibis Styles Nagoya.",
          "placeId": "place-nagoya"
        },
        {
          "id": "day-09-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 10,
      "date": "2026-12-26",
      "title": "Nagoya",
      "locations": [
        "Nagoya"
      ],
      "schedule": [
        {
          "id": "day-10-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 11,
      "date": "2026-12-27",
      "title": "Nagoya to Matsushiro, Nagano",
      "locations": [
        "Nagoya",
        "Matsushiro, Nagano"
      ],
      "schedule": [
        {
          "id": "day-11-event-1",
          "time": "11:00",
          "type": "check-out",
          "text": "Check out from ibis Styles Nagoya.",
          "placeId": "place-nagoya"
        },
        {
          "id": "day-11-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Nagoya to Matsushiro, Nagano.",
          "placeIds": [
            "place-nagoya",
            "place-nagano"
          ]
        },
        {
          "id": "day-11-event-3",
          "time": "15:00",
          "type": "check-in",
          "text": "Check in at Mercure Nagano Matsushiro Resort & Spa.",
          "placeId": "place-nagano"
        },
        {
          "id": "day-11-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 12,
      "date": "2026-12-28",
      "title": "Matsushiro, Nagano",
      "locations": [
        "Matsushiro, Nagano"
      ],
      "schedule": [
        {
          "id": "day-12-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 13,
      "date": "2026-12-29",
      "title": "Matsushiro, Nagano to Hakone",
      "locations": [
        "Matsushiro, Nagano",
        "Hakone"
      ],
      "schedule": [
        {
          "id": "day-13-event-1",
          "time": "11:00",
          "type": "check-out",
          "text": "Check out from Mercure Nagano Matsushiro Resort & Spa.",
          "placeId": "place-nagano"
        },
        {
          "id": "day-13-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Matsushiro, Nagano to Hakone.",
          "placeIds": [
            "place-nagano",
            "place-hakone"
          ]
        },
        {
          "id": "day-13-event-3",
          "time": "15:00",
          "type": "check-in",
          "text": "Check in at Hakone Hotel.",
          "placeId": "place-hakone"
        },
        {
          "id": "day-13-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 14,
      "date": "2026-12-30",
      "title": "Hakone",
      "locations": [
        "Hakone"
      ],
      "schedule": [
        {
          "id": "day-14-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 15,
      "date": "2026-12-31",
      "title": "Hakone to Kawagoe",
      "locations": [
        "Hakone",
        "Kawagoe"
      ],
      "schedule": [
        {
          "id": "day-15-event-1",
          "time": "11:00",
          "type": "check-out",
          "text": "Check out from Hakone Hotel.",
          "placeId": "place-hakone"
        },
        {
          "id": "day-15-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Hakone to Kawagoe.",
          "placeIds": [
            "place-hakone",
            "place-kawagoe"
          ]
        },
        {
          "id": "day-15-event-3",
          "time": "14:00",
          "type": "check-in",
          "text": "Check in at Kawagoe Tobu Hotel.",
          "placeId": "place-kawagoe"
        },
        {
          "id": "day-15-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 16,
      "date": "2027-01-01",
      "title": "Kawagoe",
      "locations": [
        "Kawagoe"
      ],
      "schedule": [
        {
          "id": "day-16-tbd",
          "time": "TBD",
          "type": "attraction",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    },
    {
      "day": 17,
      "date": "2027-01-02",
      "title": "Kawagoe to Singapore",
      "locations": [
        "Kawagoe",
        "Tokyo",
        "Singapore"
      ],
      "schedule": [
        {
          "id": "day-17-event-1",
          "time": "11:00",
          "type": "check-out",
          "text": "Check out from Kawagoe Tobu Hotel.",
          "placeId": "place-kawagoe"
        },
        {
          "id": "day-17-event-2",
          "time": "TBD",
          "type": "drive",
          "text": "Self-drive from Kawagoe to Tokyo Haneda Airport.",
          "placeIds": [
            "place-kawagoe",
            "place-haneda"
          ]
        },
        {
          "id": "day-17-event-3",
          "time": "13:00",
          "type": "return",
          "text": "Return the rental car at Nissan Rent a Car, Haneda Airport.",
          "placeId": "place-haneda"
        },
        {
          "id": "day-17-event-4",
          "time": "16:40",
          "type": "flight",
          "text": "SQ 633 departs Tokyo Haneda Airport for Singapore Changi Airport."
        },
        {
          "id": "day-17-event-5",
          "time": "23:25",
          "type": "flight",
          "text": "Arrive at Singapore Changi Airport."
        },
        {
          "id": "day-17-tbd",
          "time": "TBD",
          "type": "note",
          "text": "TBD (To Be Determined)"
        }
      ],
      "notes": []
    }
  ],
  "places": [
    {
      "id": "place-haneda",
      "name": "Tokyo Haneda Airport",
      "cityOrArea": "Tokyo",
      "address": "Haneda Airport, Ota City, Tokyo, Japan",
      "geo": {
        "lat": 35.5494,
        "lng": 139.7798
      },
      "category": "airport"
    },
    {
      "id": "place-tokyo",
      "name": "Tokyo",
      "cityOrArea": "Tokyo",
      "geo": {
        "lat": 35.6762,
        "lng": 139.6503
      },
      "category": "attraction"
    },
    {
      "id": "place-minakami",
      "name": "Bettei Senjuan",
      "cityOrArea": "Minakami, Gunma",
      "geo": {
        "lat": 36.795,
        "lng": 138.968
      },
      "category": "hotel",
      "address": "614 Tanigawa, Minakami, Tone-gun, Gunma 379-1619, Japan"
    },
    {
      "id": "place-tonami",
      "name": "Mercure Toyama Tonami Resort & Spa",
      "cityOrArea": "Tonami, Toyama",
      "address": "330 Tenno, Yasukawa, Tonami, Toyama 939-1438, Japan",
      "geo": {
        "lat": 36.581,
        "lng": 136.963
      },
      "category": "hotel"
    },
    {
      "id": "place-nagoya",
      "name": "ibis Styles Nagoya",
      "cityOrArea": "Nagoya",
      "address": "4-22-24 Meieki, Nakamura-ku, Nagoya 450-0002, Japan",
      "geo": {
        "lat": 35.169,
        "lng": 136.889
      },
      "category": "hotel"
    },
    {
      "id": "place-nagano",
      "name": "Mercure Nagano Matsushiro Resort & Spa",
      "cityOrArea": "Matsushiro, Nagano",
      "address": "1372-1 Nishiderao, Matsushiromachi, Nagano 381-1215, Japan",
      "geo": {
        "lat": 36.565,
        "lng": 138.197
      },
      "category": "hotel"
    },
    {
      "id": "place-hakone",
      "name": "Hakone Hotel",
      "cityOrArea": "Hakone, Kanagawa",
      "address": "65 Hakone, Hakone-machi, Kanagawa 250-0521, Japan",
      "geo": {
        "lat": 35.192,
        "lng": 139.026
      },
      "category": "hotel"
    },
    {
      "id": "place-kawagoe",
      "name": "Kawagoe Tobu Hotel",
      "cityOrArea": "Kawagoe, Saitama",
      "address": "8-1 Wakitahoncho, Kawagoe, Saitama 350-1123, Japan",
      "geo": {
        "lat": 35.906,
        "lng": 139.482
      },
      "category": "hotel"
    }
  ],
  "restaurants": [],
  "bookingsAndTickets": [],
  "ticketPlanning": {
    "statusStorage": "local",
    "statusStorageNote": "Ticket status is stored only in this browser by default.",
    "items": []
  },
  "preTrip": {
    "packingItems": [],
    "preparationsExplicitlyMentioned": [],
    "missingNote": "No pre-trip to-do items were provided."
  },
  "mapLinks": {
    "providedGoogleMapsLinks": [],
    "note": "Open place links for live directions and current road conditions.",
    "cityLevelNavigationDisabled": false,
    "navigationPolicy": {
      "noNavigationTypes": [
        "flight",
        "note",
        "rest"
      ],
      "selfNavigationTypes": [
        "drive",
        "return",
        "transfer",
        "check-in",
        "check-out",
        "restaurant",
        "attraction",
        "walk",
        "hike"
      ]
    },
    "navigationPlaces": []
  },
  "issuesAndUncertainties": [
    {
      "severity": "info",
      "status": "open",
      "title": "Tokyo accommodation is TBD",
      "detail": "No Tokyo hotel confirmation was included in the supplied documents."
    },
    {
      "severity": "info",
      "status": "accepted-for-preview",
      "title": "Daily sightseeing plans are TBD",
      "detail": "The page includes a complete day-by-day structure ready for later planning."
    }
  ],
  "map": {
    "schemaVersion": "1.0-lite",
    "mapMode": "template-auto",
    "templateId": "auto",
    "disclaimer": "This diagram shows relative locations and route order only; it is not to scale and does not represent precise geographic boundaries.",
    "region": {
      "id": "japan",
      "label": "Japan",
      "countryCode": "JP",
      "countryCodes": [
        "JP"
      ]
    },
    "places": [
      {
        "id": "place-haneda",
        "name": "Tokyo Haneda Airport",
        "countryCode": "JP",
        "geo": {
          "lat": 35.5494,
          "lng": 139.7798
        },
        "category": "airport",
        "days": [
          1,
          4,
          17
        ]
      },
      {
        "id": "place-tokyo",
        "name": "Tokyo",
        "countryCode": "JP",
        "geo": {
          "lat": 35.6762,
          "lng": 139.6503
        },
        "category": "attraction",
        "days": [
          1,
          2,
          3
        ]
      },
      {
        "id": "place-minakami",
        "name": "Minakami",
        "countryCode": "JP",
        "geo": {
          "lat": 36.795,
          "lng": 138.968
        },
        "category": "hotel",
        "days": [
          4,
          5,
          6
        ]
      },
      {
        "id": "place-tonami",
        "name": "Tonami, Toyama",
        "countryCode": "JP",
        "geo": {
          "lat": 36.581,
          "lng": 136.963
        },
        "category": "hotel",
        "days": [
          6,
          7,
          8,
          9
        ]
      },
      {
        "id": "place-nagoya",
        "name": "Nagoya",
        "countryCode": "JP",
        "geo": {
          "lat": 35.169,
          "lng": 136.889
        },
        "category": "hotel",
        "days": [
          9,
          10,
          11
        ]
      },
      {
        "id": "place-nagano",
        "name": "Matsushiro, Nagano",
        "countryCode": "JP",
        "geo": {
          "lat": 36.565,
          "lng": 138.197
        },
        "category": "hotel",
        "days": [
          11,
          12,
          13
        ]
      },
      {
        "id": "place-hakone",
        "name": "Hakone",
        "countryCode": "JP",
        "geo": {
          "lat": 35.192,
          "lng": 139.026
        },
        "category": "hotel",
        "days": [
          13,
          14,
          15
        ]
      },
      {
        "id": "place-kawagoe",
        "name": "Kawagoe",
        "countryCode": "JP",
        "geo": {
          "lat": 35.906,
          "lng": 139.482
        },
        "category": "hotel",
        "days": [
          15,
          16,
          17
        ]
      }
    ],
    "routes": [
      {
        "day": 1,
        "placeIds": [
          "place-haneda",
          "place-tokyo"
        ]
      },
      {
        "day": 2,
        "placeIds": [
          "place-tokyo"
        ]
      },
      {
        "day": 3,
        "placeIds": [
          "place-tokyo"
        ]
      },
      {
        "day": 4,
        "placeIds": [
          "place-haneda",
          "place-minakami"
        ]
      },
      {
        "day": 5,
        "placeIds": [
          "place-minakami"
        ]
      },
      {
        "day": 6,
        "placeIds": [
          "place-minakami",
          "place-tonami"
        ]
      },
      {
        "day": 7,
        "placeIds": [
          "place-tonami"
        ]
      },
      {
        "day": 8,
        "placeIds": [
          "place-tonami"
        ]
      },
      {
        "day": 9,
        "placeIds": [
          "place-tonami",
          "place-nagoya"
        ]
      },
      {
        "day": 10,
        "placeIds": [
          "place-nagoya"
        ]
      },
      {
        "day": 11,
        "placeIds": [
          "place-nagoya",
          "place-nagano"
        ]
      },
      {
        "day": 12,
        "placeIds": [
          "place-nagano"
        ]
      },
      {
        "day": 13,
        "placeIds": [
          "place-nagano",
          "place-hakone"
        ]
      },
      {
        "day": 14,
        "placeIds": [
          "place-hakone"
        ]
      },
      {
        "day": 15,
        "placeIds": [
          "place-hakone",
          "place-kawagoe"
        ]
      },
      {
        "day": 16,
        "placeIds": [
          "place-kawagoe"
        ]
      },
      {
        "day": 17,
        "placeIds": [
          "place-kawagoe",
          "place-haneda"
        ]
      }
    ],
    "dailyRoutes": [
      {
        "day": 1,
        "placeIds": [
          "place-haneda",
          "place-tokyo"
        ],
        "scheduleItems": [
          "day-01-event-3"
        ]
      },
      {
        "day": 2,
        "placeIds": [
          "place-tokyo"
        ]
      },
      {
        "day": 3,
        "placeIds": [
          "place-tokyo"
        ]
      },
      {
        "day": 4,
        "placeIds": [
          "place-haneda",
          "place-minakami"
        ],
        "scheduleItems": [
          "day-04-event-2"
        ]
      },
      {
        "day": 5,
        "placeIds": [
          "place-minakami"
        ]
      },
      {
        "day": 6,
        "placeIds": [
          "place-minakami",
          "place-tonami"
        ],
        "scheduleItems": [
          "day-06-event-2"
        ]
      },
      {
        "day": 7,
        "placeIds": [
          "place-tonami"
        ]
      },
      {
        "day": 8,
        "placeIds": [
          "place-tonami"
        ]
      },
      {
        "day": 9,
        "placeIds": [
          "place-tonami",
          "place-nagoya"
        ],
        "scheduleItems": [
          "day-09-event-2"
        ]
      },
      {
        "day": 10,
        "placeIds": [
          "place-nagoya"
        ]
      },
      {
        "day": 11,
        "placeIds": [
          "place-nagoya",
          "place-nagano"
        ],
        "scheduleItems": [
          "day-11-event-2"
        ]
      },
      {
        "day": 12,
        "placeIds": [
          "place-nagano"
        ]
      },
      {
        "day": 13,
        "placeIds": [
          "place-nagano",
          "place-hakone"
        ],
        "scheduleItems": [
          "day-13-event-2"
        ]
      },
      {
        "day": 14,
        "placeIds": [
          "place-hakone"
        ]
      },
      {
        "day": 15,
        "placeIds": [
          "place-hakone",
          "place-kawagoe"
        ],
        "scheduleItems": [
          "day-15-event-2"
        ]
      },
      {
        "day": 16,
        "placeIds": [
          "place-kawagoe"
        ]
      },
      {
        "day": 17,
        "placeIds": [
          "place-kawagoe",
          "place-haneda"
        ],
        "scheduleItems": [
          "day-17-event-2"
        ]
      }
    ]
  },
  "routeMap": {
    "defaultRegionId": "japan",
    "regions": [
      {
        "id": "japan",
        "label": "Japan",
        "countryCode": "JP",
        "scope": "template-schematic",
        "mapMode": "frozen-template",
        "templateId": "inland-alpine",
        "mapModeReason": "east-west-route",
        "mapModeMetrics": {
          "placeCount": 8,
          "geoPlaceCount": 8,
          "widthKm": 259.83,
          "heightKm": 180.49,
          "spanKm": 277.94,
          "averageNearestKm": 69.82,
          "components": 1,
          "largestLegKm": 194.9,
          "jumpRatio": 1.24
        },
        "days": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17
        ],
        "canvas": {
          "width": 1448,
          "height": 1086
        },
        "projection": {
          "type": "relative-schematic",
          "bounds": null
        },
        "baseImage": "assets/maps/kanto-chubu-relief-clean.png",
        "title": "Japan · Travel Route",
        "ariaLabel": "Japan illustrative travel route covering 17 days",
        "disclaimer": "This diagram shows relative locations and route order only; it is not to scale and does not represent precise geographic boundaries.",
        "heading": {
          "text": "Japan",
          "x": 33,
          "y": 105,
          "size": 40
        },
        "legend": {
          "x": 35,
          "y": 168,
          "gap": 43
        },
        "annotations": [],
        "routes": [
          {
            "day": 1,
            "color": "#397dc1",
            "placeIds": [
              "place-haneda",
              "place-tokyo"
            ],
            "paths": [
              "M1191.21 666.91 C1157.7 658.0 1129.3 640.8 1107.6 616.24"
            ],
            "overviewPaths": [
              "M1191.21 666.91 C1157.7 658.0 1129.3 640.8 1107.6 616.24"
            ]
          },
          {
            "day": 2,
            "color": "#e77e22",
            "placeIds": [
              "place-tokyo"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 3,
            "color": "#618344",
            "placeIds": [
              "place-tokyo"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 4,
            "color": "#209aaa",
            "placeIds": [
              "place-tokyo",
              "place-minakami"
            ],
            "paths": [
              "M1191.21 666.91 C1146.3 530.1 1075.5 408.5 982.86 309.04"
            ],
            "overviewPaths": [
              "M1191.21 666.91 C1146.3 530.1 1075.5 408.5 982.86 309.04"
            ]
          },
          {
            "day": 5,
            "color": "#8865a5",
            "placeIds": [
              "place-minakami"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 6,
            "color": "#df6185",
            "placeIds": [
              "place-minakami",
              "place-tonami"
            ],
            "paths": [
              "M982.86 309.04 C830.6 298.8 682.3 318.4 546.6 366.54"
            ],
            "overviewPaths": [
              "M982.86 309.04 C830.6 298.8 682.3 318.4 546.6 366.54"
            ]
          },
          {
            "day": 7,
            "color": "#397dc1",
            "placeIds": [
              "place-tonami"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 8,
            "color": "#e77e22",
            "placeIds": [
              "place-tonami"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 9,
            "color": "#618344",
            "placeIds": [
              "place-tonami",
              "place-nagoya"
            ],
            "paths": [
              "M546.6 366.54 C571.1 496.8 565.6 625.8 530.5 745.96"
            ],
            "overviewPaths": [
              "M546.6 366.54 C571.1 496.8 565.6 625.8 530.5 745.96"
            ]
          },
          {
            "day": 10,
            "color": "#209aaa",
            "placeIds": [
              "place-nagoya"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 11,
            "color": "#8865a5",
            "placeIds": [
              "place-nagoya",
              "place-nagano"
            ],
            "paths": [
              "M530.5 745.96 C603.4 600.3 700.1 472.7 815.1 370.84"
            ],
            "overviewPaths": [
              "M530.5 745.96 C603.4 600.3 700.1 472.7 815.1 370.84"
            ]
          },
          {
            "day": 12,
            "color": "#df6185",
            "placeIds": [
              "place-nagano"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 13,
            "color": "#397dc1",
            "placeIds": [
              "place-nagano",
              "place-hakone"
            ],
            "paths": [
              "M815.1 370.84 C903.4 483.1 964.7 608.5 995.48 739.78"
            ],
            "overviewPaths": [
              "M815.1 370.84 C903.4 483.1 964.7 608.5 995.48 739.78"
            ]
          },
          {
            "day": 14,
            "color": "#e77e22",
            "placeIds": [
              "place-hakone"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 15,
            "color": "#618344",
            "placeIds": [
              "place-hakone",
              "place-kawagoe"
            ],
            "paths": [
              "M995.48 739.78 C1004.3 655.3 1035.4 580.0 1086.71 518.19"
            ],
            "overviewPaths": [
              "M995.48 739.78 C1004.3 655.3 1035.4 580.0 1086.71 518.19"
            ]
          },
          {
            "day": 16,
            "color": "#209aaa",
            "placeIds": [
              "place-kawagoe"
            ],
            "paths": [],
            "overviewPaths": []
          },
          {
            "day": 17,
            "color": "#8865a5",
            "placeIds": [
              "place-kawagoe",
              "place-haneda"
            ],
            "paths": [
              "M1086.71 518.19 C1137.1 558.3 1172.6 608.9 1191.21 666.91"
            ],
            "overviewPaths": [
              "M1086.71 518.19 C1137.1 558.3 1172.6 608.9 1191.21 666.91"
            ]
          }
        ],
        "places": [
          {
            "id": "place-haneda",
            "x": 1191.21,
            "y": 666.91,
            "color": "#397dc1",
            "category": "airport",
            "tx": 1053.21,
            "ty": 578.91,
            "size": 24,
            "anchor": "end",
            "lines": [
              "Tokyo Haneda Airport"
            ],
            "query": "Tokyo Haneda Airport Japan",
            "geo": {
              "lat": 35.5494,
              "lng": 139.7798
            },
            "days": [
              1,
              4,
              17
            ]
          },
          {
            "id": "place-tokyo",
            "x": 1107.6,
            "y": 616.24,
            "color": "#397dc1",
            "category": "attraction",
            "tx": 1075.6,
            "ty": 666.24,
            "size": 24,
            "anchor": "end",
            "lines": [
              "Tokyo"
            ],
            "query": "Tokyo Japan",
            "geo": {
              "lat": 35.6762,
              "lng": 139.6503
            },
            "days": [
              1,
              2,
              3
            ]
          },
          {
            "id": "place-minakami",
            "x": 982.86,
            "y": 309.04,
            "color": "#209aaa",
            "category": "hotel",
            "tx": 1060.86,
            "ty": 247.04,
            "size": 24,
            "anchor": "start",
            "lines": [
              "Minakami"
            ],
            "query": "Minakami Japan",
            "geo": {
              "lat": 36.795,
              "lng": 138.968
            },
            "days": [
              4,
              5,
              6
            ]
          },
          {
            "id": "place-tonami",
            "x": 546.6,
            "y": 366.54,
            "color": "#df6185",
            "category": "hotel",
            "tx": 468.6,
            "ty": 442.54,
            "size": 24,
            "anchor": "end",
            "lines": [
              "Tonami, Toyama"
            ],
            "query": "Tonami, Toyama Japan",
            "geo": {
              "lat": 36.581,
              "lng": 136.963
            },
            "days": [
              6,
              7,
              8,
              9
            ]
          },
          {
            "id": "place-nagoya",
            "x": 530.5,
            "y": 745.96,
            "color": "#618344",
            "category": "hotel",
            "tx": 668.5,
            "ty": 657.96,
            "size": 24,
            "anchor": "start",
            "lines": [
              "Nagoya"
            ],
            "query": "Nagoya Japan",
            "geo": {
              "lat": 35.169,
              "lng": 136.889
            },
            "days": [
              9,
              10,
              11
            ]
          },
          {
            "id": "place-nagano",
            "x": 815.1,
            "y": 370.84,
            "color": "#8865a5",
            "category": "hotel",
            "tx": 847.1,
            "ty": 420.84,
            "size": 24,
            "anchor": "start",
            "lines": [
              "Matsushiro, Nagano"
            ],
            "query": "Matsushiro, Nagano Japan",
            "geo": {
              "lat": 36.565,
              "lng": 138.197
            },
            "days": [
              11,
              12,
              13
            ]
          },
          {
            "id": "place-hakone",
            "x": 995.48,
            "y": 739.78,
            "color": "#397dc1",
            "category": "hotel",
            "tx": 1027.48,
            "ty": 789.78,
            "size": 24,
            "anchor": "start",
            "lines": [
              "Hakone"
            ],
            "query": "Hakone Japan",
            "geo": {
              "lat": 35.192,
              "lng": 139.026
            },
            "days": [
              13,
              14,
              15
            ]
          },
          {
            "id": "place-kawagoe",
            "x": 1086.71,
            "y": 518.19,
            "color": "#618344",
            "category": "hotel",
            "tx": 1054.71,
            "ty": 486.19,
            "size": 24,
            "anchor": "end",
            "lines": [
              "Kawagoe"
            ],
            "query": "Kawagoe Japan",
            "geo": {
              "lat": 35.906,
              "lng": 139.482
            },
            "days": [
              15,
              16,
              17
            ]
          }
        ],
        "overviewPlaceIds": [
          "place-haneda",
          "place-tokyo",
          "place-minakami",
          "place-tonami",
          "place-nagoya",
          "place-nagano",
          "place-hakone",
          "place-kawagoe"
        ],
        "dailyLayouts": {
          "1": {
            "places": [
              "place-haneda",
              "place-tokyo"
            ],
            "labels": {
              "place-haneda": {
                "x": 1053.21,
                "y": 578.91,
                "anchor": "end"
              },
              "place-tokyo": {
                "x": 1075.6,
                "y": 666.24,
                "anchor": "end"
              }
            },
            "transport": [
              {
                "items": "day-01-event-3",
                "x": 1149.4,
                "y": 641.58
              }
            ]
          },
          "2": {
            "places": [
              "place-tokyo"
            ],
            "labels": {
              "place-tokyo": {
                "x": 1075.6,
                "y": 666.24,
                "anchor": "end"
              }
            },
            "transport": []
          },
          "3": {
            "places": [
              "place-tokyo"
            ],
            "labels": {
              "place-tokyo": {
                "x": 1075.6,
                "y": 666.24,
                "anchor": "end"
              }
            },
            "transport": []
          },
          "4": {
            "places": [
              "place-haneda",
              "place-minakami"
            ],
            "labels": {
              "place-haneda": {
                "x": 1053.21,
                "y": 578.91,
                "anchor": "end"
              },
              "place-minakami": {
                "x": 1060.86,
                "y": 247.04,
                "anchor": "start"
              }
            },
            "transport": [
              {
                "items": "day-04-event-2",
                "x": 1087.04,
                "y": 487.98
              }
            ]
          },
          "5": {
            "places": [
              "place-minakami"
            ],
            "labels": {
              "place-minakami": {
                "x": 1060.86,
                "y": 247.04,
                "anchor": "start"
              }
            },
            "transport": []
          },
          "6": {
            "places": [
              "place-minakami",
              "place-tonami"
            ],
            "labels": {
              "place-minakami": {
                "x": 1060.86,
                "y": 247.04,
                "anchor": "start"
              },
              "place-tonami": {
                "x": 468.6,
                "y": 442.54,
                "anchor": "end"
              }
            },
            "transport": [
              {
                "items": "day-06-event-2",
                "x": 764.73,
                "y": 337.79
              }
            ]
          },
          "7": {
            "places": [
              "place-tonami"
            ],
            "labels": {
              "place-tonami": {
                "x": 468.6,
                "y": 442.54,
                "anchor": "end"
              }
            },
            "transport": []
          },
          "8": {
            "places": [
              "place-tonami"
            ],
            "labels": {
              "place-tonami": {
                "x": 468.6,
                "y": 442.54,
                "anchor": "end"
              }
            },
            "transport": []
          },
          "9": {
            "places": [
              "place-tonami",
              "place-nagoya"
            ],
            "labels": {
              "place-tonami": {
                "x": 468.6,
                "y": 442.54,
                "anchor": "end"
              },
              "place-nagoya": {
                "x": 668.5,
                "y": 657.96,
                "anchor": "start"
              }
            },
            "transport": [
              {
                "items": "day-09-event-2",
                "x": 538.55,
                "y": 556.25
              }
            ]
          },
          "10": {
            "places": [
              "place-nagoya"
            ],
            "labels": {
              "place-nagoya": {
                "x": 668.5,
                "y": 657.96,
                "anchor": "start"
              }
            },
            "transport": []
          },
          "11": {
            "places": [
              "place-nagoya",
              "place-nagano"
            ],
            "labels": {
              "place-nagoya": {
                "x": 668.5,
                "y": 657.96,
                "anchor": "start"
              },
              "place-nagano": {
                "x": 847.1,
                "y": 420.84,
                "anchor": "start"
              }
            },
            "transport": [
              {
                "items": "day-11-event-2",
                "x": 672.8,
                "y": 558.4
              }
            ]
          },
          "12": {
            "places": [
              "place-nagano"
            ],
            "labels": {
              "place-nagano": {
                "x": 847.1,
                "y": 420.84,
                "anchor": "start"
              }
            },
            "transport": []
          },
          "13": {
            "places": [
              "place-nagano",
              "place-hakone"
            ],
            "labels": {
              "place-nagano": {
                "x": 847.1,
                "y": 420.84,
                "anchor": "start"
              },
              "place-hakone": {
                "x": 1027.48,
                "y": 789.78,
                "anchor": "start"
              }
            },
            "transport": [
              {
                "items": "day-13-event-2",
                "x": 905.29,
                "y": 555.31
              }
            ]
          },
          "14": {
            "places": [
              "place-hakone"
            ],
            "labels": {
              "place-hakone": {
                "x": 1027.48,
                "y": 789.78,
                "anchor": "start"
              }
            },
            "transport": []
          },
          "15": {
            "places": [
              "place-hakone",
              "place-kawagoe"
            ],
            "labels": {
              "place-hakone": {
                "x": 1027.48,
                "y": 789.78,
                "anchor": "start"
              },
              "place-kawagoe": {
                "x": 1054.71,
                "y": 486.19,
                "anchor": "end"
              }
            },
            "transport": [
              {
                "items": "day-15-event-2",
                "x": 1041.1,
                "y": 628.99
              }
            ]
          },
          "16": {
            "places": [
              "place-kawagoe"
            ],
            "labels": {
              "place-kawagoe": {
                "x": 1054.71,
                "y": 486.19,
                "anchor": "end"
              }
            },
            "transport": []
          },
          "17": {
            "places": [
              "place-kawagoe",
              "place-haneda"
            ],
            "labels": {
              "place-kawagoe": {
                "x": 1054.71,
                "y": 486.19,
                "anchor": "end"
              },
              "place-haneda": {
                "x": 1053.21,
                "y": 578.91,
                "anchor": "end"
              }
            },
            "transport": [
              {
                "items": "day-17-event-2",
                "x": 1138.96,
                "y": 592.55
              }
            ]
          }
        }
      }
    ]
  },
  "expenses": {
    "baseCurrency": "SGD",
    "referenceRates": {
      "JPY": 0.00825,
      "SGD": 1
    },
    "rateNote": "Fallback reference: JPY 1 = SGD 0.00825 (JPY 1,000 ≈ SGD 8.25). Live rates are requested when available.",
    "items": [
      {
        "id": "expense-minakami",
        "date": "2026-12-20",
        "category": "Accommodation",
        "description": "Bettei Senjuan",
        "originalCurrency": "JPY",
        "originalAmount": 246600,
        "sgdAmount": 2034.45,
        "rateUsed": 0.00825,
        "address": "614 Tanigawa, Minakami, Tone-gun, Gunma 379-1619, Japan",
        "note": "",
        "source": "Booking confirmation"
      },
      {
        "id": "expense-toyama",
        "date": "2026-12-22",
        "category": "Accommodation",
        "description": "Mercure Toyama Tonami Resort & Spa",
        "originalCurrency": "JPY",
        "originalAmount": 21600,
        "sgdAmount": 178.2,
        "rateUsed": 0.00825,
        "address": "330 Tenno, Yasukawa, Tonami, Toyama 939-1438, Japan",
        "note": "",
        "source": "Booking confirmation"
      },
      {
        "id": "expense-nagoya",
        "date": "2026-12-25",
        "category": "Accommodation",
        "description": "ibis Styles Nagoya",
        "originalCurrency": "JPY",
        "originalAmount": 16150,
        "sgdAmount": 133.24,
        "rateUsed": 0.00825,
        "address": "4-22-24 Meieki, Nakamura-ku, Nagoya 450-0002, Japan",
        "note": "",
        "source": "Booking confirmation"
      },
      {
        "id": "expense-nagano",
        "date": "2026-12-27",
        "category": "Accommodation",
        "description": "Mercure Nagano Matsushiro Resort & Spa",
        "originalCurrency": "JPY",
        "originalAmount": 26733,
        "sgdAmount": 220.55,
        "rateUsed": 0.00825,
        "address": "1372-1 Nishiderao, Matsushiromachi, Nagano 381-1215, Japan",
        "note": "Cash amount after 4,000 reward points; booking value JPY 41,230.",
        "source": "Booking confirmation"
      },
      {
        "id": "expense-hakone",
        "date": "2026-12-29",
        "category": "Accommodation",
        "description": "Hakone Hotel",
        "originalCurrency": "SGD",
        "originalAmount": 848.81,
        "sgdAmount": 848.81,
        "rateUsed": 1,
        "address": "65 Hakone, Hakone-machi, Kanagawa 250-0521, Japan",
        "note": "Includes SGD 4.86 due at the property.",
        "source": "Booking confirmation"
      },
      {
        "id": "expense-kawagoe",
        "date": "2026-12-31",
        "category": "Accommodation",
        "description": "Kawagoe Tobu Hotel",
        "originalCurrency": "SGD",
        "originalAmount": 560.99,
        "sgdAmount": 560.99,
        "rateUsed": 1,
        "address": "8-1 Wakitahoncho, Kawagoe, Saitama 350-1123, Japan",
        "note": "",
        "source": "Booking confirmation"
      }
    ]
  }
};
