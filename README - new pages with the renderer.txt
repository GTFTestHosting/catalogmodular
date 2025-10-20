Step-by-Step Guide to Adding a New Bento Page
Here is the complete workflow, from creating the data to making it appear on your site.

Step 1: Create the Content (The JSON Data)
This is always the first step. You create the content for your new page in the data/ directory.

Create a New Folder: Inside both data/en/ and data/es/, create a new folder for your page. Let's call it our-process.

Create Panel Files: Inside data/en/our-process/, create individual JSON files for each panel you want on the page (e.g., step1.json, step2.json, etc.).

Create the Manifest: Inside data/en/our-process/, create the main manifest file for the page, named after the page itself: our-process.json. This file simply lists the paths to your panel files in the order you want them to appear.

Example our-process.json manifest:

JSON

[
    "data/en/our-process/intro-panel.json",
    "data/en/our-process/mixing-panel.json",
    "data/en/our-process/cooking-panel.json",
    "data/en/our-process/packaging-panel.json"
]
Step 2: Add the Link to the Navigation (The HTML)
Now, you need to add a button to your navigation bars so users can get to the new page. You need to add this in two places in your index.html file.

Desktop Nav: Add a new <li> to the <ul> inside <nav class="main-nav">.

Mobile Nav: Add the exact same <li> to the <ul> inside <nav class="mobile-nav">.

Example index.html change:

HTML

<!-- Inside both .main-nav and .mobile-nav -->
<ul>
    <li><a href="#" class="nav-link" data-page="home" data-lang-key="navHome">Home</a></li>
    <li><a href="#" class="nav-link" data-page="catalog" data-lang-key="navCatalog">Catalog</a></li>
    <li><a href="#" class="nav-link" data-page="about" data-lang-key="navAbout">About Us</a></li>
    <!-- Add your new link here -->
    <li><a href="#" class="nav-link" data-page="our-process" data-lang-key="navProcess">Our Process</a></li> 
    <li><a href="#" class="nav-link" data-page="contact" data-lang-key="navContact">Contact</a></li>
</ul>
(Don't forget to add the navProcess key to your language files!)

Step 3: Tell the Router How to Handle the New Page (The JavaScript)
This is the final and easiest step. You just need to tell the router that your new "Our Process" page should be handled by the generic bento page renderer.

Open your js/router.js file and add a new case to the switch statement.

Example router.js change:

JavaScript

// ... inside the renderPage function in js/router.js
switch (page) {
    case 'catalog':
        initializeCatalog(appState, options.startCategory);
        break;
    case 'home':
        renderHomePage(appState);
        break;
    case 'about':
    case 'contact':
    case 'our-process': // <-- Add the new case here
        renderBentoPage(page, appState);
        break;
    default:
        renderHomePage(appState);
}
That's it! You do not need to create a new our-process.html file. The renderBentoPage function is a reusable template that automatically loads the bento-shell.html and then populates it with the content from the specific manifest file it's told to use (e.g., our-process.json).

Your understanding of the structure is perfect. By following these three steps, you can add as many bento-style pages as you want to your website in a clean and modular way.