import Driver from "driver.js";

export function pageDriver() {
  const driver = new Driver({
    allowClose: false,
    opacity: 0.5
  });

  let steps = [
    {
      element: "#source-homepage",
      popover: {
        title: "Title",
        description: "This is the homepage for <em>A Course Of Love</em>.<br><br>Click on an image below to see the table of contents.",
        position: "bottom"
      }
    },
    {
      element: "#book-acq",
      popover: {
        title: "Get Acquainted",
        description: "Get help and learn about ACOL",
        position: "right"
      }
    },
    {
      element: "#book-course",
      popover: {
        title: "The Course",
        description: "Book One; The Course contains 32 chapters and Learning in the time of Christ.",
        position: "left"
      }
    },
    {
      element: "#book-treatises",
      popover: {
        title: "The Treatises",
        description: `There are four treatises:
        <ol>
        <li>A Treatise on the Art of Thought</li>
        <li>A Treatise on the Nature of Unity and its Recognition</li>
        <li>A Treatise on the Personal Self</li>
        <li>A Treatise on the New</li>
        </ol>`,
        position: "right"
      }
    },
    {
      element: "#book-dialogues",
      popover: {
        title: "The Dialogues",
        description: "Dialogues with Jesus including The Forty Days and Forty Nights",
        position: "left"
      }
    }
  ];

  driver.defineSteps(steps);
  driver.start();
}


