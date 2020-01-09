import backend from "../../src/backend";

export default backend({
  hello: async () => "world"
}).start(8080);
