import { App } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import signin from "#app/pages/signin";
import signup from "#app/pages/signup";
import board from "#app/pages/board";
import thumbnail from "#app/pages/thumbnail";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";

const app = new App();

app.route("/", home);
app.route("/signin", signin);
app.route("/signup", signup);
app.route("/b/:id", board);
app.route("/b/:id/thumbnail.svg", thumbnail);

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
