import "./styles/app.css";
import { store } from "./store";
import { initCharts } from "./charts";
import { bindUi, render } from "./ui/render";

bindUi();
initCharts();
store.subscribe(render);
render();
