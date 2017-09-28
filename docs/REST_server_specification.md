# Specification of the REST-Server for Domain Classification


## Scope

This specification defines an interface to gather measurements for the classification of domains. It is possible to gather more than one measurement (from different users) for a domain. The calculation of the final classification based on the measurements is not part of this specification.

The interface follows the **JsonAPI Specification** (http://jsonapi.org/)

## Workflow

The interface specified here is the back end interface for a browser plugin. After starting up, the browser plugin fetches the user data (/users), the list of categories (/categories) in the desired language and the list of statuses (/statuses). This information has to be cached within the plugin.

The plugin fetches unmeasured (by the current user) domains via /fetch and presents the website to the user. The user could decide to add a measurement or to leave the page with the "panic-button". The plugin adds a measurement (POST to /measurements) with the added information and fetches a new domain.

## Authentication

The authentication is done via API-Keys. The "Bearer Token" subset of OAuth 2.0 is used (see RFC 6750). An additional header "Authorization" with the value "Bearer &lt;token&gt;" MUST be added to every API request. This "Bearer Token" has to be entered into the plugin by the user initially.

## Base URL (API Version)

All API calls are prefixed with this URI:
``/api/v1``

A full prefix to an API call looks like this:
``https://address-to-server.at/api/v1``

## ContentType
The content type MUST be set to "application/vnd.api+json"

## Pagination and Sorting
The REST-Server supports the following features for all API calls (based on the JsonAPI specification):

* Sorting http://jsonapi.org/format/#fetching-sorting

* Pagination    http://jsonapi.org/format/#fetching-pagination
  * the default page size is 15 items per page.

* Filtering http://jsonapi.org/recommendations/#filtering
  * **only** supported by **Categories** and **Domains** objects

## Objects

The implementation is based on five objects (further explained below):

1. **Categories:** Main- and subcategories based on the Data-Nerds Workinggroup
2. **Domains:** Domain objects which are to be categorized by the plugin users
3. **Statuses:** Possible statuses of a measurement. The following statuses have to be supported but can be extended if needed:

   1. *success*, ID: 1 -- user finished classification
   2. *panic*, ID: 2 -- user did emergency exit from domain ("panic-button")
   3. *unsure*, ID: 3 -- user failed to identify even a top level category
   4. *noncomprende*, ID: 4 -- user failed to understand the language
   5. *loadfail*, ID: 5 -- browser failed to load the page
4. **Measurements:** a measurement object is created by an agent. Each measurement object consists of one domain, one status object and one category object (a domain object can have more than one measurement object). The category object can be optional (in case of an "emergency exit" during the classification, no category can be set).
5. **User:** a (pseudo) object which contains some information of the authorized user

### Categories
A Category object consists of:

* **website-category-id:** Unique id (assigned by the data nerds working group)
* **maincategory:** Main category (defined by the data nerds working group)
* **subcategory:** Subcategory of the main category (defined by the data nerds working group)
* **lang:** Language of the category names (at least "en" MUST be supported)
* **description:** description of the category

The "meta" section contains the total count of measurements that have been submitted under this category.

```javascript
{
    "data": {
        "type": "categories",
        "id": "1105",
        "attributes": {
            "website-category-id": 1105,
            "maincategory": "Automotive",
            "subcategory": "Wholesale trade of motor vehicle parts and accessories",
            "lang": "en",
            "description": "This is a test description"
        },
        "relationships": {
            "measurements": {
                "meta": {
                    "total": 1
                },
                "links": {
                    "self": "https://classify-rest.labs.nic.at/api/v1/categories/1105/relationships/measurements",
                    "related": "https://classify-rest.labs.nic.at/api/v1/categories/1105/measurements"
                }
            }
        },
        "links": {
            "self": "https://classify-rest.labs.nic.at/api/v1/categories/1105"
        }
    }
}
```

### Domains

A domain object consists of:

* unique **domain-id**
* **domain-name** (a-label)
* **u-label**
* **create-date**

The "meta" section contains the number of received measurements for this domain (attribute "count").

```javascript
{
    "data": {
        "type": "domains",
        "id": "2",
        "attributes": {
            "domain-id": 2,
            "domain-name": "domain1.at",
            "u-label": "domain1.at",
            "create-date": "2014-01-01 00:00:00"
        },
        "relationships": {
            "measurements": {
                "meta": {
                    "count": 1
                },
                "links": {
                    "self": "https://classify-rest.labs.nic.at/api/v1/domains/2/relationships/measurements",
                    "related": "https://classify-rest.labs.nic.at/api/v1/domains/2/measurements"
                }
            }
        },
        "links": {
            "self": "https://classify-rest.labs.nic.at/api/v1/domains/2"
        }
    }
}
```

### Status

A status object consists of:

* unique **measurement-status-id**
* **status**

The "meta" section contains the total number of measurements created with this status.
```javascript
{
    "data": {
        "type": "statuses",
        "id": "1",
        "attributes": {
            "measurement-status-id": 1,
            "status": "success"
        },
        "relationships": {
            "measurements": {
                "meta": {
                    "total": 1
                },
                "links": {
                    "self": "https://classify-rest.labs.nic.at/api/v1/statuses/1/relationships/measurements",
                    "related": "https://classify-rest.labs.nic.at/api/v1/statuses/1/measurements"
                }
            }
        },
        "links": {
            "self": "https://classify-rest.labs.nic.at/api/v1/statuses/1"
        }
    }
}
```
### Measurements

 A measurement object consists of: 

* unique **id** (assigned by the server)
* **username** (authorized user which performed the measurement, added by the server)
* **final-url** (The last URL the user saw before the classification was submitted)
* **confidence** (a value between **1** (very unconfident) and **100** (extremely confident), submitted by the user)
* and **relationships** to
-- **domain object**: the domain which has been classified
-- **status object**: the status of the measurement
-- **category object**: the chosen category for the measurement

```javascript
{
    "data": {
        "type": "measurements",
        "id": "2",
        "attributes": {
            "measurement-id": 2,
            "username": "mib@nic.at",
            "final-url": "https://www.nic.at/dada",
            "confidence": 98
        },
        "relationships": {
            "domains": {
                "data": {
                    "type": "domains",
                    "id": "2"
                },
                "links": {
                    "self": "https://classify-rest.labs.nic.at/api/v1/measurements/2/relationships/domains",
                    "related": "https://classify-rest.labs.nic.at/api/v1/measurements/2/domains"
                }
            },
            "categories": {
                "data": {
                    "type": "categories",
                    "id": "1105"
                },
                "links": {
                    "self": "https://classify-rest.labs.nic.at/api/v1/measurements/2/relationships/categories",
                    "related": "https://classify-rest.labs.nic.at/api/v1/measurements/2/categories"
                }
            },
            "statuses": {
                "data": {
                    "type": "statuses",
                    "id": "1"
                },
                "links": {
                    "self": "https://classify-rest.labs.nic.at/api/v1/measurements/2/relationships/statuses",
                    "related": "https://classify-rest.labs.nic.at/api/v1/measurements/2/statuses"
                }
            }
        },
        "links": {
            "self": "https://classify-rest.labs.nic.at/api/v1/measurements/2"
        }
    }
}
```

### User

The user object is a "pseudo" object which returns some "verbose" information about the user to make the plugin more "friendly"

```javascript
{
    "data": {
        "type": "users",
        "id": "1",
        "attributes": {
            "created-at": "2017-07-05T10:05:52+00:00",
            "updated-at": null,
            "name": "Michael Braunoeder",
            "email": "mib@nic.at"
        },
        "links": {
            "self": "https://classify-rest.labs.nic.at/api/v1/users/1"
        }
    }
}
```

## REST API calls

**/users** <br> Method: **GET** <br> Returns a "pseudo" user object with the user's corresponding user information.

**/fetch**<br> Method: **GET** <br> Parameters: filter[lang]=&lt;lang[, lang2, lang3, . . .]&gt; (optional)<br>Example: /fetch?filter[lang]=en,de,fr<br><br>Returns a redirect to a randomly selected domain object which has no measurement object for the current user. The client MUST follow this redirect and fetch the domain object. <br>If the "?filter[lang]=<lang>" parameter is given, the server SHOULD return a redirect to a random select domain object with the given language(s).

**/categories** <br> Method: **GET** <br> Parameters: filter[lang]=&lt;lang&gt;<br><br> Returns a complete list of all category-objects. Without the filter parameter the server returns all category objects in all languages. The client SHOULD use the "?filter[lang]=<lang>" parameter to get the object only in the requested language. If the server does not return any object in the requested language the client should request the English objects with "filter[lang]=en". The server MUST support at least the English objects.

**/categories/{resource_id}** <br> Method: **GET** <br> Returns the category object with the given ID.

**/categories/{resource_id}/measurements** <br> Method: **GET** <br> Returns the **full** measurement objects which are in a relationship with the given category.

**/categories/{resource_id}/relationships/measurements** <br> Method: **GET** <br> Returns the list of measurement IDs which are in a relationship with the given category.

**/domains** <br> Method: **GET** <br> Returns a list of all domain objects.

**/domains/{resource_id}** <br> Method: **GET** <br> Returns the domain object with the given ID.

**/domains/{resource_id}/measurements** <br> Method: **GET** <br> Returns the **full** measurement object for the given domain ID.

**/domains/{resource_id}/relationships/measurements** <br> Method: **GET** <br> Returns the ID(s) of the measurement(s) which are defined for the given domain.

**/statuses**<br> Method: **GET**<br> Returns a list of all status objects. The client MUST cache this list and assign it to measurements.

**statuses/{resource_id}** <br> Method: **GET** <br> Returns the status object with the given ID.

**/statuses/{resource_id}/measurements** <br> Method: **GET** <br> Returns the **full** measurement objects which are in a relationship with the given status.

**/status/{resource_id}/relationships/measurements** <br> Method: **GET** <br> Returns the list of measurement IDs which are in a relationship with the given status.

**/measurements** <br> Method: **GET** <br> Returns all measurement objects. <br><br> Method: **POST** <br>Creates a new measurement.  <br> The request body looks as follows:

```javascript
{
    "data": {
        "type": "measurements",
        "attributes": {
            "finalurl": "https://www.volkswagen.at/kaefer",
            "confidence": 42
        },
        "relationships": {
            "domains": {
                "data": {
                    "type": "domains",
                    "id": "3"
                }
            },
            "categories": {
                "data": {
                    "type": "categories",
                    "id": "1104"
                }
            },
            "statuses": {
                "data": {
                    "type": "statuses",
                    "id": "1"
                }
            }
        }
    }
}
```

**/measurements/{resource_id}** <br> Method: **GET** <br> Returns the measurement object with the given ID.

**/measurements/{resource_id}/domains** <br> Method: **GET** <br> Returns the **full** domain object for the given measurement ID.

**/measurements/{resource_id}/relationships/domains** <br> Method **GET** <br> Returns the ID of the domain which is assigned to the given measurement.

**/measurements/{resource_id}/categories** <br> Method: **GET** <br> Returns the **full** category object for the given measurement ID.

**/measurements/{resource_id}/relationships/categories** <br> Method: **GET** <br> Returns the ID of the category which is assigned to the given measurement.

**/measurements/{resource_id}/statuses** <br> Method: **GET** <br> Returns the full status object for the given measurement ID.

**/measurements/{resource_id}/relationships/statuses** <br> Method: **GET** <br> Returns the ID of the status object which is assigned to the given measurement.