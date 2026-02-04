function getRawFromContext(ctx) {
  return ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
}

export { getRawFromContext };
