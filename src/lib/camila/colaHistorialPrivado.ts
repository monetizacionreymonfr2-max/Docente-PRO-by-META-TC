/** Serializa escrituras y evita que un guardado pendiente se cruce con un borrado. */
export class ColaHistorialPrivado {
  private pendiente: Promise<void> = Promise.resolve();
  private bloqueados = new Set<string>();

  encolar(id: string, guardar: () => Promise<void>): Promise<void> {
    if (this.bloqueados.has(id)) return Promise.resolve();
    const siguiente = this.pendiente.catch(() => undefined).then(async () => {
      if (!this.bloqueados.has(id)) await guardar();
    });
    this.pendiente = siguiente;
    return siguiente;
  }

  async prepararEliminacion(id: string): Promise<void> {
    this.bloqueados.add(id);
    await this.pendiente.catch(() => undefined);
  }

  finalizarEliminacion(id: string): void {
    this.bloqueados.delete(id);
  }
}
